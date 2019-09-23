const fs = require('fs');
const path = require('path');
const http = require('http');
const Koa = require('koa');
const cors = require('koa-cors');
const PathMatch = require('path-match');
const staticCache = require('koa-static-cache');
const httpProxy = require('http-proxy');

const createDebug = require('debug');

const debug = createDebug('spa-server');

var proxy = httpProxy.createServer();

class SpaServer {
  constructor() {
  }

  setDebug(config) {
    var logDir = config.logDir;
    if (process.env.LOG_DIR) {
      logDir = process.env.LOG_DIR;
    }
    if (logDir && fs.statSync(logDir).isDirectory()) {
      const reg = /^spa-server.(\d{4}-\d{2}-\d{2}).log$/;
      const filePathList = fs.readdirSync(logDir).filter(it => reg.test(it)).sort((pre, next) => {
        const preStamp = reg.exec(pre)[1].split('-').join();
        const nextStamp = reg.exec(next)[1].split('-').join();
        return pre - next;
      });

      var fileStatList = filePathList.map(it => fs.statSync(it));
      var totalSize = fileStatList.reduce((sum, it) => {
        sum += it.size;
        return sum;
      }, 0);
      while ((totalSize > config.maxLogSize) && filePathList.length > 1) {
        let filePath = filePathList.shift();
        let stat = fileStatList.shift();
        fs.unlinkSync(filePath)
        totalSize = fileStatList.reduce((sum, it) => {
          sum += it.size;
          return sum;
        }, 0);
      }
      // console.log(filePathList);
      // console.log(fileStatList);
      // console.log(totalSize);
    }
    createDebug.getState().setConfigs({
      debug: 'spa-server',
      useColors: logDir ? false : true,
      toFile: logDir ? path.resolve(logDir, 'spa-server') : null
    });
  }

  // 跨域配置
  setCors(app) {
    app.use(cors({
      allowMethods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
    }));
  }

  // 捕获异常
  setLogger(app) {
    // catch error in outer middleware
    app.use(async (ctx, next) => {
      const start = Date.now();
      // debug('<--', ctx.method, ctx.url);

      const res = ctx.res

      const onfinish = done.bind(null, 'finish')
      const onclose = done.bind(null, 'close')

      res.once('finish', onfinish)
      res.once('close', onclose)

      function done (event) {
        res.removeListener('finish', onfinish)
        res.removeListener('close', onclose)
        debug('-->', ctx.method, ctx.url, ctx.status, `[${Date.now() - start}ms]`)
        // log(print, ctx, start, counter ? counter.length : length, null, event)
      }

      try {
        await next();
      } catch (err) {
        // console.log(err);
        debug(err);
      }
    });
  }

  // 健康检查配置
  setHealthCheck(app, config) {
    if (!config.healthCheck) {
      return;
    }
    app.use(async(ctx, next) => {
      if (['/health', '/healthcheck', '/health-check'].includes(ctx.url.toLowerCase())) {
        ctx.status = 200;
        ctx.body = 'server aliving';
      } else {
        await next();
      }
    });
  }

  /**
   * Koa Http Proxy Middleware
   */
  proxyMiddleware (matchPath, config) {
    const pathMatch = PathMatch({
      // path-to-regexp options
      sensitive: false,
      strict: false,
      end: false,
    })(matchPath);
    return async(ctx, next) => {
      if (!config.hasOwnProperty('target') || !config.hasOwnProperty('changeOrigin')) {
        return await next();
      }

      const {
        target,
        changeOrigin,
        pathRewrite
      } = config;
      // whether request.url match matchPath
      const matchResults = pathMatch(ctx.url);
      if (!matchResults) {
        return await next();
      }

      let start = Date.now();
      return new Promise((resolve, reject) => {
        ctx.req.oldPath = ctx.req.url;

        if (typeof pathRewrite === 'function') {
          ctx.req.url = pathRewrite(ctx.req.url, matchResults);
        }

        proxy.web(ctx.req, ctx.res, {
          target, changeOrigin
        }, err => {
          const status = {
            ECONNREFUSED: 503,
            ETIMEOUT: 504,
          }[err.code];
          if (status) {
            ctx.status = status;
          }
          debug(err);
          ctx.respond = false;
          reject(err);
          // resolve();
        });
        proxy.once('end', () => {
          let duration = Date.now() - start;
          // debug('proxy', ctx.req.method, ctx.req.oldPath, 'to', target + ctx.req.url, `[${duration}ms]`);
          ctx.respond = false;
          resolve();
        })
      });
    }
  }

  // 配置代理
  setProxy(app, config) {
    if (!config.proxy) {
      return;
    }
    for (let key in config.proxy) {
      app.use(this.proxyMiddleware(key, config.proxy[key]));
    }
  }

  // 路径重定向
  setRewrite(app, config) {
    if (!config.historyApiFallback) {
      return;
    }
    const middleware = require('connect-history-api-fallback')(config.historyApiFallback);
    app.use((ctx, next) => {
      middleware(ctx, null, () => {});
      return next();
    });
  }

  // 配置静态服务
  setStatic(app, config) {
    if (!config.staticPath) {
      return;
    }
    const addStatic = (dir) => {
      if (!fs.existsSync(dir)) {
        return;
      }
      app.use(staticCache(dir, {
        gzip: true,
        preload: true,
        buffer: false,
        dynamic: true,
        filter: function(filePath) {
          return !/^node_modules\/.*$/.test(filePath);
        },
      }));
    };
    if (Array.isArray(config)) {
      config.staticPath.forEach(addStatic);
    } else {
      addStatic(config.staticPath);
    }
  }

  start(config) {
    config = Object.assign({
      port: 6001,
      healthCheck: true,
      maxLogSize: 1024 * 1024 * 1024
    }, config);
    this.setDebug(config);
    debug(config);

    const app = new Koa();
    this.setCors(app);
    this.setLogger(app, config);
    this.setHealthCheck(app, config);
    this.setProxy(app, config);
    this.setStatic(app, config);
    this.setRewrite(app, config);
    this.setStatic(app, config);

    app.listen(config.port);
    debug('服务已启动', config.port);
  }
}

module.exports = SpaServer;
