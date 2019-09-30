const fs = require('fs');
const path = require('path');
const zlib = require('zlib')
const Stream = require('stream');

// NOTICE: 
const nodeUtils = new (require('../../../utils/node'))();

// 注意require('koa-router')返回的是函数:
const router = require('koa-router')();

// handle data of body before sent
async function handleBody(ctx, next) {
  var body = ctx.body;
  if (!body) {
    return next();
  }
  if (nodeUtils.isPlainObject(body)) {
    body = JSON.stringify(body);
  }
  if (Buffer.isBuffer(body)) {
    body = body.toString();
  }
  if ('string' == typeof body) {
    body = nodeUtils.toStream(body);
  }
  if (body instanceof Stream) {
    if (ctx.acceptsEncodings('gzip') === 'gzip' && (ctx.get['content-encoding'] !== 'gzip')) {
      ctx.set('content-encoding', 'gzip');
      body = body.pipe(zlib.createGzip());
    }
  }

  const withCookie = ctx.query['cookie'];
  if (withCookie) {
    var count = ~~ctx.cookies.get('count') + 1;
    ctx.cookies.set('count', count);
    ctx.cookies.set('rich', 'with all config', {
      maxage: 1000 * 6,
      httpOnly: false
    });
  }

  // const feature = ctx.query.feature;
  const slow = ctx.query['slow'];
  var logWait = ctx.query['long-wait'];
  if (logWait) {
    try {
      logWait = parseInt(logWait);
    } catch(err) {
      logWait = 5;
    }
  }
  
  if (slow) {
    const slowTransform = nodeUtils.slowStream(1024, 500);
    body = body.pipe(slowTransform);
  }
  if (logWait) {
    await nodeUtils.waitMilliSeconds(logWait * 1000);
  }

  ctx.body = body;
}

// common get
router.get('/api/test/get/common', async(ctx, next) => {
  let req = ctx.req; // 原request
  let res = ctx.res; // 原response
  const extension = ctx.query['extension'];
  const feature = ctx.query.feature;

  const getStreamByType = (extension) => {
    var body = null;
    switch (extension) {
      case 'xml':
        ctx.type = 'xml';
        body = nodeUtils.toStream('<div>this is a div</div>');
        break;
      case 'png':
        ctx.type = 'png';
        body = fs.createReadStream(nodeUtils.findClosestFile(__dirname, 'assets/imgs/gnu-icon-small.png'));
        break;
      case 'js':
        ctx.type = 'js';
        body = fs.createReadStream(path.resolve(__dirname, 'router.js'));
        break;
      case 'arraybuffer':
      case 'bin':
        // TODO: not used
        ctx.type = 'bin';
        body = fs.createReadStream(path.resolve(__dirname, 'router.js'));
        break;
      default:
        body = nodeUtils.toStream(ctx.url);
        break;
    }
    return body;
  }
  
  ctx.body = getStreamByType(extension ? extension : 'js');
  handleBody(ctx, next);
});

router.post('/api/test/post/common', async(ctx, next) => {
  ctx.assert(ctx.request.body, 200, nodeUtils.error({
    msg: 'body not found'
  }));

  const multipart = ctx.request.body;
  var fileList = [];
  Object.keys(multipart.files).forEach(key => {
    fileList = fileList.concat(multipart.files[key]);
  });
  if (fileList.length > 0) {
    const uploadDir = path.resolve(ctx.app.UPLOAD_DIR, 'uploads');
    // mkdir uploads if necessary
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    fileList.forEach(file => {
      var ext = path.extname(file.name);
      const basename = path.basename(file.name, ext);
      // ext = ext.replace(/(\.[a-z0-9]+).*/i, '$1');
      fs.writeFileSync(path.resolve(uploadDir, `${file.hash}.${basename}${ext}`), file.data);
    });
  }
  ctx.type = 'json';
  ctx.body = ctx.request.body;
  // console.log(ctx.body);
  handleBody(ctx, next);
});

router.all('/api/test/echo', async(ctx, next) => {
  // ctx.request.data is get by parsedByFormidable
  const buf = ctx.request.data ? ctx.request.data : await nodeUtils.getStreamData(ctx.req);
  // console.log(ctx.req.headers)
  // console.log(buf.toString());
  ctx.type = 'json';
  ctx.body = {
    general: `${ctx.method} ${ctx.path} ${ctx.protocol}`,
    url: ctx.url,
    headers: ctx.headers,
    body: buf.toString()
  };
  // console.log(ctx.body);
  handleBody(ctx, next);
});

router.all('/api/test/error', async(ctx, next) => {
  ctx.throw(200, {
    message: JSON.stringify({
      success: false,
      msg: '错误信息'
    })
  });
});


module.exports = router;

// add router middleware:
// app.use(router.routes());

// app.listen(3001);

// const keysPath = busybox.nodeUtils.node.findClosestFile(__dirname, 'assets/files/https-keys');
// var options = {
//   key: fs.readFileSync(path.resolve(keysPath, 'server-key.pem')),
//   cert: fs.readFileSync(path.resolve(keysPath, 'server-cert.pem')),
//   ca: [fs.readFileSync(path.resolve(keysPath, 'ca-cert.pem'))]
// };

// const startHttps = process.env.protocol === 'https';

// if (startHttps) {
//   https.createServer(options, app.callback()).listen(3001);
//   console.log('server started: https://127.0.0.1:3001');
// } else {
//   http.createServer(app.callback()).listen(3001);
//   console.log('server started: http://127.0.0.1:3001');
// }

