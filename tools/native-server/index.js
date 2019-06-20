const fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');
const Stream = require('stream');
const compose = require('koa-compose');
const mimeTypes = require('mime-types');
const formidable = require('formidable');
const busybox = require('../../');

class NativeServer {
  constructor(options = {
    staticDir: null,
    uploadDir: null,
  }) {
    this.STATIC_DIR = options.staticDir ? options.staticDir : process.cwd();
    this.UPLOAD_DIR = options.uploadDir ? options.uploadDir : process.cwd();
    this._httpServer = null;
  }

  resWritable(res) {
    // can't write any more after response finished
    if (res.finished) return false;
    const socket = res.socket;
    // There are already pending outgoing res, but still writable
    // https://github.com/nodejs/node/blob/v4.4.7/lib/_http_server.js#L486
    if (!socket) return true;
    return socket.writable;
  }

  getCorsMiddleware(options) {
    options = options || {};
    var defaults = {
      origin: true,
      methods: 'GET,HEAD,PUT,POST,DELETE'
    };
    // Set defaults
    for (var key in defaults) {
      if (!options.hasOwnProperty(key)) {
        options[key] = defaults[key];
      }
    }
    // Set expose
    if (Array.isArray(options.expose)) {
      options.expose = options.expose.join(',');
    }
    // Set maxAge
    if (typeof options.maxAge === 'number') {
      options.maxAge = options.maxAge.toString();
    } else {
      options.maxAge = null;
    }
    // Set methods
    if (Array.isArray(options.methods)) {
      options.methods = options.methods.join(',');
    }
    // Set headers
    if (Array.isArray(options.headers)) {
      options.headers = options.headers.join(',');
    }
    return async function(ctx, next) {
      /**
       * Access Control Allow Origin
       */
      var origin;
      if (typeof options.origin === 'string') {
        origin = options.origin;
      } else if (options.origin === true) {
        origin = ctx.req.headers['origin'] || '*';
      } else if (options.origin === false) {
        origin = options.origin;
      } else if (typeof options.origin === 'function') {
        origin = options.origin(ctx.req);
      }

      if (origin === false) {
        await next();
        return;
      }

      ctx.headers['Access-Control-Allow-Origin'] = origin;
      /**
       * Access Control Expose Headers
       */
      if (options.expose) {
        ctx.headers['Access-Control-Expose-Headers'] = options.expose;
      }
      /**
       * Access Control Max Age
       */
      if (options.maxAge) {
        ctx.headers['Access-Control-Max-Age'] = options.maxAge;
      }
      /**
       * Access Control Allow Credentials
       */
      if (options.credentials === true) {
        ctx.headers['Access-Control-Allow-Credentials'] = 'true';
      }
      /**
       * Access Control Allow Methods
       */
      ctx.headers['Access-Control-Allow-Methods'] = options.methods;
      /**
       * Access Control Allow Headers
       */
      var headers;
      if (options.headers) {
        headers = options.headers;
      } else {
        headers = ctx.req.headers['access-control-request-headers'];
      }
      if (headers) {
        ctx.headers['Access-Control-Allow-Headers'] = headers;
      }
      /**
       * Returns
       */
      if (ctx.req.method === 'OPTIONS') {
        ctx.status = 204;
      } else {
        await next();
      }
    };
  }

  async parseByFormidable(ctx, next) {
    const {req, res, urlObj} = ctx;
    const pathname = urlObj.pathname;
    if (!pathname.startsWith('/api/post')) {
      return await next();
    }
    const uploadDir = this.uploadDir;

    var form = new formidable.IncomingForm({
      uploadDir,
      keepExtensions: true,
      hash: 'md5'
    });

    const multipart = await new Promise((resolve, reject) => {
      // form.on('progress', (bytesReceived, bytesExpected) => {
      //   console.log(`${bytesReceived} / ${bytesExpected}`);
      // });
      form.parse(ctx.req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            fields,
            files
          });
        }
      });
    });

    const resBody = {};
    resBody.fields = multipart.fields;
    resBody.files = {};

    // mkdir uploads if necessary
    var fileList = [];
    Object.keys(multipart.files).forEach(key => {
      fileList = fileList.concat(multipart.files[key]);
    });
    if (fileList.length > 0) {
      const uploadDir = path.resolve(this.UPLOAD_DIR, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
    }

    // save files to local
    Object.keys(multipart.files).forEach(key => {
      resBody.files[key] = [];
      const fileList = multipart.files[key];
      fileList.forEach(file => {
        resBody.files[key].push(file.name);
        var ext = path.extname(file.name);
        ext = ext.replace(/(\.[a-z0-9]+).*/i, '$1');
        fs.writeFileSync(path.resolve(uploadDir, `${file.hash}${ext}`), file.data);
      });
    });

    ctx.type = 'json';
    ctx.body = JSON.stringify(resBody);
  }

  // response assets file
  async responseAssets(ctx, next) {
    const {req, res, urlObj} = ctx;
    const pathname = urlObj.pathname;
    if (pathname.startsWith('/assets')) {
      const targetFile = busybox.utils.node.findClosestFile(__dirname, pathname.replace('/', ''));
      if (!fs.existsSync(targetFile)) {
        ctx.status = 200;
        ctx.type = 'html';
        ctx.body = `file ${pathname.replace('/', '')} not found`;
        return;
      }
      const statInfo = fs.statSync(targetFile);
      if (statInfo.isDirectory()) {
        if (!pathname.endsWith('/')) {
          ctx.status = 301;
          ctx.type = 'text/plain; charset=utf-8';
          ctx.headers['Location'] = `${pathname}/`;
          ctx.body = `Redirecting to ${pathname}/.`;
          return;
        } else {
          ctx.type = 'html';
        }
      } else if (statInfo.isFile()) {
        ctx.type = targetFile.split('.').pop();
      }
      const fileStream = await busybox.utils.node.getFileStream4Response(targetFile);
      // console.log(`${targetFile}: ${fileStream}`);
      if (fileStream) {
        ctx.status = 200;
        ctx.body = fileStream;
      } else {
        await next();
      }
    } else {
      await next();
    }
  }

  // response static file
  async responseStaticFile(ctx, next) {
    const {req, res, urlObj} = ctx;
    const pathname = urlObj.pathname;
    var file = pathname;
    if (pathname.startsWith('/')) {
      file = file.replace('/', '');
    }
    const targetFile = path.resolve(this.STATIC_DIR, file);
    if (!fs.existsSync(targetFile)) {
      ctx.status = 200;
      ctx.type = 'html';
      ctx.body = `file ${file} not found`;
      return;
    }
    const statInfo = fs.statSync(targetFile);
    if (statInfo.isDirectory()) {
      if (!pathname.endsWith('/')) {
        ctx.status = 301;
        ctx.type = 'text/plain; charset=utf-8';
        ctx.headers['Location'] = `${pathname}/`;
        ctx.body = `Redirecting to ${pathname}/.`;
        return;
      } else {
        ctx.type = 'html';
      }
    } else if (statInfo.isFile()) {
      ctx.type = targetFile.split('.').pop();
    }
    const fileStream = await busybox.utils.node.getFileStream4Response(targetFile);
    // console.log(`${targetFile}: ${fileStream}`);
    if (fileStream) {
      ctx.status = 200;
      ctx.body = fileStream;
    } else {
      await next();
    }
  }

  handleRequest(req, res) {
    const ctx = {req, res, status: 200, type: 'json', headers: {}, urlObj: url.parse(req.url), body: null};
    ctx.urlObj.pathname = decodeURI(ctx.urlObj.pathname);
    ctx.urlObj.path = decodeURI(ctx.urlObj.path);
    const middleware = [this.getCorsMiddleware(), this.parseByFormidable.bind(this), this.responseAssets.bind(this), this.responseStaticFile.bind(this)];
    const fnMiddleware = compose(middleware);
    fnMiddleware(ctx).then(() => {
      console.log(`process path: ${ctx.urlObj.path}`);
      if (null === ctx.body) {
        ctx.status = 200;
        ctx.type = 'html';
        ctx.body = `path not found: ${ctx.urlObj.path}`;
      }
      // console.log(`resWritable: ${this.resWritable(ctx.res)}`);
      const body = ctx.body;
      res.statusCode = ctx.status;
      if (!ctx.headers.hasOwnProperty('Content-Type')) {
        ctx.headers['Content-Type'] = mimeTypes.contentType(ctx.type);
      }
      for (let key in ctx.headers) {
        res.setHeader(key, ctx.headers[key]);
      }
      if (body === null) return res.end();
      if (Buffer.isBuffer(body)) return res.end(body);
      if ('string' == typeof body) return res.end(body);
      if (body instanceof Stream) return body.pipe(res);
    }).catch(err => {
      console.log('error catched:');
      console.log(err);
    });
  }

  async start() {
    const ip = busybox.utils.node.getLocalIP();

    var port = await busybox.utils.node.getAFreePort();
    if (process.env.PORT) {
      port = process.env.PORT;
    }

    return new Promise((resolve, reject) => {
      const server = http.createServer(this.handleRequest.bind(this)).listen(port);
      server.on('error', (err) => {
        console.log(err);
        reject(err);
      });
      server.on('listening', () => {
        console.log(`start server: http://${ip}:${port}`);
        resolve(server);
      });
      this._httpServer = server;
    });
  }

  get httpServer() {
    return this._httpServer;
  }
}

module.exports = NativeServer;
