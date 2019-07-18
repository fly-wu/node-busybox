/*
  reverse-proxy.js: Example of reverse proxying (with HTTPS support)
  Copyright (c) 2015 Alberto Pose <albertopose@gmail.com>
  
  Permission is hereby granted, free of charge, to any person obtaining
  a copy of this software and associated documentation files (the
  "Software"), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:
  
  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var http = require('http'),
    net = require('net'),
    url = require('url'), path = require('path'),
    util = require('util');

const busybox = require('../../..');
const httpProxy = busybox['node-http-proxy'];
const Debug = busybox['debug'];
Debug.getState().setConfigs({
  debug: '*',
  useColors: true,
  toFile: path.resolve(__dirname, 'logs/proxy.log')
});
debug = Debug('penetrate-fortress');


class Helper {
  constructor() {
    const proxy = httpProxy.createServer();

    async function getStreamData(reader) {
      return new Promise((resolve, reject) => {
        var bufferList = [];
        reader.on('data', function(chunk){
          // this.log(chunk);
          // result += chunk;
          bufferList.push(chunk);
        });
        reader.on('end', function() {
          resolve(Buffer.concat(bufferList));
        });
        reader.on('error', function(err) {
          reject(err);
        })
      })
    }

    proxy.on('proxyRes', (proxyRes, req, res) => {
      var startTime = Date.now();
      // this.log(`response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
      // this.log(proxyRes.headers);
      proxyRes.on('data', data => {
        // this.log(`data of: ${req.url}`);
        // this.log(data.toString());
      });
      proxyRes.on('end', () => {
        this.log(`http://${req.headers['host']}${req.url} [${Date.now() - startTime}ms]`);
        // this.log(`end of: ${req.url}`);
      })
    });
    proxy.on('end', (req, res, proxyRes) => {
      // this.log(`proxy end: ${req.url}`);
    });
    proxy.on('error', (err, req, res, url) => {
      this.log(`proxy error catched: ${url}`);
      this.log(err);
    });

    this.proxy = proxy;
  }

  log() {
    // console.log.apply(null, Array.prototype.slice.call(arguments))
    debug.apply(null, Array.prototype.slice.call(arguments));
  }

  proxy103_6001() {
    const proxyOptions = {
      target: 'http://172.31.160.103:6001',
      changeOrigin: true
    }
    var server = http.createServer((req, res) => {
      this.proxy.web(req, res, proxyOptions);
    }).listen(6001);
  }

  proxy106_6001() {
    const proxyOptions = {
      target: 'http://172.31.160.106:6001',
      changeOrigin: true
    }
    var server = http.createServer((req, res) => {
      this.proxy.web(req, res, proxyOptions);
    }).listen(6003);
  }

  proxy103_30334() {
    const proxyOptions = {
      target: 'http://10.10.202.143:30334',
      changeOrigin: true
    }
    var server = http.createServer((req, res) => {
      this.proxy.web(req, res, proxyOptions);
    }).listen(30334);
  }

  start() {
    this.proxy103_6001();
    this.proxy106_6001();
  }
}

new Helper().start();
