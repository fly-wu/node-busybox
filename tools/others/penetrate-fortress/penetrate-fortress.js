

var http = require('http'),
    net = require('net'),
    url = require('url'), 
    path = require('path'),
    util = require('util');

const httpProxy = require('node-http-proxy');
const createDebug = require('debug');
createDebug.getState().setConfigs({
  debug: '*',
  useColors: true,
  toFile: path.resolve(__dirname, 'logs/proxy.log')
});
debug = createDebug('penetrate-fortress');

const proxy = httpProxy.createServer();

class Proxy {
  constructor() {
  }

  log() {
    // console.log.apply(null, Array.prototype.slice.call(arguments))
    debug.apply(null, Array.prototype.slice.call(arguments));
  }

  startProxyServer(proxyOptions, port) {
    const server = http.createServer((req, res) => {
      const start = Date.now();
      const originUrl = req.url;
      
      proxy.web(req, res, proxyOptions);

      const onfinish = done.bind(this, 'finish')
      const onclose = done.bind(this, 'close')
      res.once('finish', onfinish)
      res.once('close', onclose)
      function done (event) {
        res.removeListener('finish', onfinish)
        res.removeListener('close', onclose)
        this.log(req.method, originUrl, 'to', `${proxyOptions.target}${req.url}`, `[${Date.now() - start}ms]`)
      }
    }).listen(port);
    server.on('listening', () => {
      this.log(`proxy server started: http://127.0.0.1:${port}`);
    });
    server.on('error', err => {
      this.log(err);
    });
  }

  'to:172.31.160.103:6001'() {
    const proxyOptions = {
      target: 'http://172.31.160.103:6001',
      changeOrigin: true
    }
    this.startProxyServer(proxyOptions, 6001);
  }

  'to:10.10.202.143:30334'() {
    const proxyOptions = {
      target: 'http://10.10.202.143:30334',
      changeOrigin: true
    }
    this.startProxyServer(proxyOptions, 30334);
  }

  another_way() {
    const proxyOptions = {
      target: 'http://10.10.202.143:30334',
      changeOrigin: true
    }
    const proxyServer = httpProxy.createServer(proxyOptions).listen(30334);
    proxyServer.on('error', (err, req, res, url) => {
      this.log(err);
    });
    proxyServer.on('end', (req, res, proxyRes) => {
      this.log(req.method, req.oldPath, 'to', target + ctx.req.url, `[${duration}ms]`);
    });
  }

  start() {
    // this.proxy103_6001();
    // this.proxy106_6001();
    // this.proxy103_30334();
    // to_10_10_202_143_30334
    this['to:172.31.160.103:6001']()
  }
}

new Proxy().start();
