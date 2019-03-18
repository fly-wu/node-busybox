const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const localUtils = require('./local');

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
//   reponseFile(filePath) {
//     const targetFile = localUtils.findClosestFile(filePath);

//     const statInfo = fs.statSync(targetFile);
//     if (statInfo.isDirectory()) {
//       var ul = await busyboxUtils.local.getFileListInFormatOfUl(targetFile);
//       ctx.type = 'html';
//       ctx.body = `<html>
//   <head>
//     <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
//     <meta name="viewport" content="initial-scale=1, width=device-width, maximum-scale=1, user-scalable=no" />
//     <link rel="stylesheet" href="">
//     <title>文件列表</title>
//     <script>
//     window.addEventListener('load', function() {
//     });
//     </script>
//     <style>
//     </style>
//   </head>
//   <body>
//     ${ul}
//   </body>
// </html>`
//     } else if (statInfo.isFile()) {
//       ctx.body = fs.createReadStream(targetFile);
//     }
//   }

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
}

module.exports = Net;