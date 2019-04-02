const fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');
const compose = require('koa-compose');
const mimeTypes = require('mime-types');
const busybox = require('../../');

class NativeServer {
  constructor() {
    this.STATIC_DIR = __dirname;
  }

  /**
   * 通用方法：处理静态文件
   * @return, true(已经处理完，不需要继续处理)，false(需要后续的middleware处理)
   */
  async responseFile(ctx, targetFile) {
    const {req, res} = ctx;
    const url = req.url;
    if (fs.existsSync(targetFile)) {
      const statInfo = fs.statSync(targetFile);
      if (statInfo.isDirectory() && !url.endsWith('/')) {
        res.writeHead(301, {
          'Location': url + '/'
        });
        res.end();
        return true;
      }
      if (statInfo.isDirectory()) {
        res.writeHead(200, {
          'Content-Type': mimeTypes.contentType('html')
        });
      } else if (statInfo.isFile()) {
        res.writeHead(200, {
          'Content-Type': mimeTypes.contentType(targetFile.split('.').pop())
        });
      }
      const resStream = await busybox.utils.server.getFileStream4Response(targetFile);
      resStream.pipe(res);
      return true;
    } else {
      return false;
    }
  }

  // response assets file
  async responseAssets(ctx, next) {
    const {req, res} = ctx;
    const url = req.url;
    if (url.startsWith('/assets')) {
      const targetFile = busybox.utils.local.findClosestFile(__dirname, url.replace('/', ''));
      const hasHandled = await this.responseFile(ctx, targetFile);
      // console.log(`${targetFile}: ${hasHandled}`);
      if (!hasHandled) {
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
    const hasHandled = await this.responseFile(ctx, targetFile);
    // console.log(`${targetFile}: ${hasHandled}`);
    if (!hasHandled) {
      await next();
    }
  }

  handleRequest(req, res) {
    const ctx = {req, res};
    const middleware = [this.responseAssets.bind(this), this.responseStaticFile.bind(this)];
    const fnMiddleware = compose(middleware);
    fnMiddleware(ctx).then(() => {
      console.log(`finish url: ${req.url}`);
      // res.writeHead(200, {
      //   'Content-Type': mimeTypes.contentType('html')
      // });
      // res.end('index page');
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

module.exports = NativeServer;
