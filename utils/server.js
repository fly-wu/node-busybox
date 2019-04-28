const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const http = require('http');
const stream = require('stream');

class Net {
  constructor(busybox) {
    this.busybox = busybox;
  }

  defaultResponse(response) {
    response.writeHead(200, {
      'Content-Type': 'html'
    });
    fs.createReadStream(path.resolve(__dirname, 'net.html')).pipe(response);
  }

  getLocalIP() {
    var localIP = null;
    var ifaces = os.networkInterfaces();
    var keys = ['en0', 'en1', 'en2', 'en5', 'eth0'];
    let iface = [];
    keys.forEach(function(key) {
      if ((key in ifaces) && (Array.isArray(ifaces[key]))) {
        iface = ifaces[key];
      }
    });
    iface.forEach(function(iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        return;
      }
      localIP = iface.address;
    });
    return localIP;
  }

  // 获取一个未被使用的端口（从3000端口开始）
  async getAFreePort() {
    async function tryPort(port) {
      const server = net.createServer().listen(port);
      const result = await new Promise((resolve,reject) => {
        server.on('listening', () => {
          server.close();
          resolve(port);
        });
        server.on('error', err => {
          if (err.code === 'EADDRINUSE') {
            resolve(null);
          } else {
            resolve(err);
          }
        })
      });
      return result;
    }
    const START_PORT = 3000;
    var port = START_PORT;
    var result = await tryPort(port);
    while (result === null) {
      port += 1;
      result = await tryPort(port);
    }
    if (result instanceof Error) {
      result = null;
    }
    return result;
  }

  parseQueryString(qs, sep, eq, options) {
    sep = sep || '&';
    eq = eq || '=';
    var obj = {};
    if (typeof qs !== 'string' || qs.length === 0) {
      return obj;
    }
    try {
      var regexp = /\+/g;
      qs = qs.split(sep);
      var maxKeys = 1000;
      if (options && typeof options.maxKeys === 'number') {
        maxKeys = options.maxKeys;
      }
      var len = qs.length;
      // maxKeys <= 0 means that we should not limit keys count
      if (maxKeys > 0 && len > maxKeys) {
        len = maxKeys;
      }
      for (var i = 0; i < len; ++i) {
        var x = qs[i].replace(regexp, '%20'),
          idx = x.indexOf(eq),
          kstr, vstr, k, v;
        if (idx >= 0) {
          kstr = x.substr(0, idx);
          vstr = x.substr(idx + 1);
        } else {
          kstr = x;
          vstr = '';
        }
        k = decodeURIComponent(kstr);
        v = decodeURIComponent(vstr);
        if (!obj.hasOwnProperty(k)) {
          obj[k] = v;
        } else if (Array.isArray(obj[k])) {
          obj[k].push(v);
        } else {
          obj[k] = [obj[k], v];
        }
      }
    } catch (error) {
      console.log('error in parseQueryString:');
      console.log(error);
      obj = {};
    }
    return obj;
  }

  /**
   * response for a file or dir
   */
  async getFileStream4Response(targetFile) {
    if (!targetFile) {
      return null;
    }
    if (!fs.existsSync(targetFile)) {
      return null;
    }

    const statInfo = fs.statSync(targetFile);
    if (statInfo.isDirectory()) {
      const ul = await this.busybox.utils.local.getFileListInFormatOfUl(targetFile);
      const body = `<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="initial-scale=1, width=device-width, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="">
    <title>文件列表</title>
    <script>
    window.addEventListener('load', function() {
    });
    </script>
    <style>
    </style>
  </head>
  <body>
    ${ul}
  </body>
</html>`;
      return new stream.Readable({
        read() {
          this.push(body);
          this.push(null);
        }
      });
    } else if (statInfo.isFile()) {
      return fs.createReadStream(targetFile);
    }
  }

  startBasicServer(cb) {
    let HTTPPORT = 0;
    let server = http.createServer((request, response) => {
      // this.showRequest(request);
      if (typeof(cb) !== 'function') {
        this.defaultResponse(response);
      } else {
        cb(request, response);
      }
    });
    server.listen(HTTPPORT);
    server.on('listening', () => {
      let port = server.address().port;
      let localIP = this.getLocalIP();
      console.log(`start at: http://${localIP}:${port}`);
    })
  }

  getParsedUrl(request) {
    // const 
    var urlString = 'http://' + request.headers['host'] + request.url;
    var obj = url.parse(urlString);
    if (obj.query) {
      obj.query = this.parseQueryString(obj.query);
    }
    return obj;
  }

  /**
   * @param {ctx}, ctx of koa
   * @param {next}, ctx of next
   * @param {prefix}, filter url started with prefix
   * @param {refDir}, the start dir from which to search target file
   */
  async koaMiddlewareResponseStatic(ctx, next, prefix, refDir = __dirname) {
    const url = ctx.url;

    if (url.startsWith(prefix)) {
      return await next();
    }
    const targetFile = this.busybox.utils.local.findClosestFile(refDir, url.replace('/', ''));
    if (!targetFile) {
      return await next();
    }
    const statInfo = fs.statSync(targetFile);
    if (statInfo.isDirectory() && !url.endsWith('/')) {
      ctx.redirect(`${url}/`);
      return;
    }
    const resStream = await this.busybox.utils.server.getFileStream4Response(targetFile);
    if (resStream) {
      if (statInfo.isDirectory()) {
        ctx.type = 'html';
      } else if (statInfo.isFile()) {
        ctx.type = targetFile.split('.').pop();
      }
      ctx.body = resStream;
    } else {
      return await next();
    }
    }
}

module.exports = Net;