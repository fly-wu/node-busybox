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

  async parseByFormidable(ctx, next) {
    const {req, res} = ctx;
    const url = req.url;
    if (!url.startsWith('/api/post')) {
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
    const {req, res} = ctx;
    const url = req.url;
    if (url.startsWith('/utils')) {
      const targetFile = busybox.utils.local.findClosestFile(__dirname, url.replace('/', ''));
      if (!fs.existsSync(targetFile)) {
        ctx.status = 200;
        ctx.type = 'html';
        ctx.body = `file ${url.replace('/', '')} not found`;
        return;
      }
      const statInfo = fs.statSync(targetFile);
      if (statInfo.isDirectory()) {
        if (!url.endsWith('/')) {
          ctx.status = 301;
          ctx.type = 'text/plain; charset=utf-8';
          ctx.headers['Location'] = `${url}/`;
          ctx.body = `Redirecting to ${url}/.`;
          return;
        } else {
          ctx.type = 'html';
        }
      } else if (statInfo.isFile()) {
        ctx.type = targetFile.split('.').pop();
      }
      const fileStream = await busybox.utils.server.getFileStream4Response(targetFile);
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
    const {req, res} = ctx;
    const url = req.url;
    var file = url;
    if (url.startsWith('/')) {
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
      if (!url.endsWith('/')) {
        ctx.status = 301;
        ctx.type = 'text/plain; charset=utf-8';
        ctx.headers['Location'] = `${url}/`;
        ctx.body = `Redirecting to ${url}/.`;
        return;
      } else {
        ctx.type = 'html';
      }
    } else if (statInfo.isFile()) {
      ctx.type = targetFile.split('.').pop();
    }
    const fileStream = await busybox.utils.server.getFileStream4Response(targetFile);
    // console.log(`${targetFile}: ${fileStream}`);
    if (fileStream) {
      ctx.status = 200;
      ctx.body = fileStream;
    } else {
      await next();
    }
  }

  handleRequest(req, res) {
    const ctx = {req, res, status: 200, type: 'json', headers: {}};
    const middleware = [this.parseByFormidable.bind(this), this.responseAssets.bind(this), this.responseStaticFile.bind(this)];
    const fnMiddleware = compose(middleware);
    fnMiddleware(ctx).then(() => {
      console.log(`process url: ${req.url}`);
      if (null === ctx.body) {
        ctx.status = 200;
        ctx.type = 'html';
        ctx.body = `url not found: ${req.url}`;
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
      if (Buffer.isBuffer(body)) return res.end(body);
      if ('string' == typeof body) return res.end(body);
      if (body instanceof Stream) return body.pipe(res);

      // console.log(`url not found: ${req.url}`);
    }).catch(err => {
      console.log('error catched:');
      console.log(err);
    });
  }

  async start() {
    const ip = busybox.utils.server.getLocalIP();

    var port = await busybox.utils.server.getAFreePort();
    if (process.env.PORT) {
      port = process.env.PORT;
    }
    // const port = 3999;
    
    const middleList = []
    
    const server = http.createServer(this.handleRequest.bind(this)).listen(port);
    server.on('error', (err) => {
      console.log(err);
    });
    server.on('listening', () => {
      console.log(`start server: http://${ip}:${port}`);
    });
  }
}

var options = {
  staticDir: null,
}

if (process.argv.length >= 3) {
  options.staticDir = path.resolve(process.argv[2]);
}

new NativeServer(options).start();
