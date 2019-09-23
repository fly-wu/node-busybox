const path = require('path');
const http = require('http');
const Koa = require('koa');
const cors = require('koa-cors');
const pathMatch = require('path-match');
const staticCache = require('koa-static-cache');
const koaProxy = require('@paas/koa-custom-proxy');

const debug = require('debug')('spa-server');
debug.getState().setConfigs({
  debug: 'spa-server:*',
  useColors: true,        // false
  toFile: path.resolve(__dirname, 'log.file')
});

const L = require('format-logger')({});

class SpaServer {
  constructor() {
  }

  // 跨域配置
  setCors(app) {
    app.use(cors({
      methods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
    }));
  }

  // 捕获异常
  catchError(app) {
    // catch error in outer middleware
    app.use(async (ctx, next) => {
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
      if (['/health', '/healthcheck', '/healthCheck'].includes(ctx.req.url.toLowerCase())) {
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
    const pathReg = pathToRegexp(matchPath);
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
          L('error =>', err);
          // resolve();
        });
        proxy.once('end', () => {
          let duration = Date.now() - start;
          if (logs) {
            debug(ctx.req.method, ctx.req.oldPath, 'to', target + ctx.req.url, `[${duration}ms]`);
          }
          // resolve();
        })
      });
    }
  }

  // 配置代理
  setProxy(app, config) {
    if (!config.proxy) {
      return;
    }
    for (let path in config.proxy) {
      var config = config.proxy[path];
      app.use(proxyMiddleware(path, config));
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
      if (!fs.existSync(dir)) {
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
      staticPath: path.join(__dirname, 'dist'),
      healthCheck: true
    }, config);
    console.log(config);

    const app = new Koa();
    this.setCors(app);
    this.catchError(app);
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