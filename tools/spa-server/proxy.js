/**
 * Created by 高乐天 on 17/7/14.
 */

const HttpProxy = require('http-proxy');
const PathMatch = require('path-match');
const L = require('format-logger')('koa-custom-proxy');

/**
 * Constants
 */

const proxy = HttpProxy.createProxyServer({});

module.exports.setProxyEvent = function(event, handle) {
  proxy.on(event, handle);
};

/**
 * Koa Http Proxy Middleware
 */
module.exports.proxy = (matchPath, options) => {
  const pathMatch = PathMatch({
    // path-to-regexp options
    sensitive: false,
    strict: false,
    end: false,
  })(matchPath);
  return async(ctx, next) => {
    const {
      logs,
      pathRewrite,
      proxyOptions
    } = options;
    if (!proxyOptions || !proxyOptions.target) {
      return await next();
    }

    // whether request.url match matchPath
    const matchResults = pathMatch(ctx.req.url);
    if (!matchResults) {
      return await next();
    }

    let start = Date.now();
    let duration = 0;
    return new Promise((resolve, reject) => {
      ctx.req.oldPath = ctx.req.url;

      if (typeof pathRewrite === 'function') {
        ctx.req.url = pathRewrite(ctx.req.url, matchResults);
      }

      proxy.web(ctx.req, ctx.res, proxyOptions, err => {
        const status = {
          ECONNREFUSED: 503,
          ETIMEOUT: 504,
        }[err.code];
        if (status) {
          ctx.status = status;
        }
        duration = Date.now() - start;
        if (logs) {
          // L(ctx.req.method, ctx.req.oldPath, 'to', proxyOptions.target + ctx.req.url, `[${duration}ms]`);
        }
        L('error =>', err);
        // resolve();
      });
      proxy.once('end', () => {
        duration = Date.now() - start;
        if (logs) {
          L(ctx.req.method, ctx.req.oldPath, 'to', proxyOptions.target + ctx.req.url, `[${duration}ms]`);
        }
        // resolve();
      })
    });
  }
};