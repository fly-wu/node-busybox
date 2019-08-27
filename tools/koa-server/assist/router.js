const fs = require('fs');
const path = require('path');
const zlib = require('zlib')
const Stream = require('stream');
const Koa = require('koa');

// NOTICE: 
const utils = require('../../../utils');

// 注意require('koa-router')返回的是函数:
const router = require('koa-router')();

async function handleBody(ctx, next) {
  var body = ctx.body;
  if (!body) {
    return next();
  }

  if (utils.node.isObject(body)) {
    body = JSON.stringify(body);
  }
  if ('string' == typeof body) {
    body = Buffer.from(body)
  }
  if (Buffer.isBuffer(body)) {
    body = utils.node.toStream(body);
    // body = zlib.gzipSync(body)
  }
  if (body instanceof Stream) {
    if (ctx.acceptsEncodings('gzip') === 'gzip' && !ctx.query['content-encoding']) {
      ctx.set('content-encoding', 'gzip');
      body = body.pipe(zlib.createGzip());
    }
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
    const slowTransform = utils.node.slowTransform(1024, 500);
    body = body.pipe(slowTransform);
  }
  if (logWait) {
    await utils.node.waitMilliSeconds(logWait * 1000);
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
        body = utils.node.toStream('<div>this is a div</div>');
        break;
      case 'png':
        ctx.type = 'png';
        body = fs.createReadStream(utils.node.findClosestFile(__dirname, 'assets/imgs/gnu-icon-small.png'));
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
        body = utils.node.toStream(ctx.url);
        break;
    }
    return body;
  }
  
  var body = getStreamByType(extension ? extension : 'js');
  switch(feature) {
    case 'slow':
      const slowTransform = utils.node.slowStream();
      body.pipe(slowTransform);
      ctx.body = slowTransform;
      break;
    case 'long-wait':
      // 等待30秒
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 30000);
      })
      ctx.body = body;
    default:
      ctx.body = body;
      break;
  }
  // handleBody(ctx, next);
});


router.post('/api/test/post/common', async(ctx, next) => {
  ctx.assert(ctx.request.body, 200, utils.node.error({
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
      fs.writeFileSync(path.resolve(uploadDir, `${file.hash}.${basename}.${ext}`), file.data);
    });
  }
  ctx.type = 'json';
  ctx.body = ctx.request.body;
  // console.log(ctx.body);
  // handleBody(ctx, next);
});

router.all('/api/test/echo', async(ctx, next) => {
  // ctx.request.data is get by parsedByFormidable
  const buf = ctx.request.data ? ctx.request.data : await utils.node.getStreamData(ctx.req);
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
  // handleBody(ctx, next);
});

router.all('/api/test/error', async(ctx, next) => {
  ctx.throw(200, {
    message: JSON.stringify({
      success: false,
      msg: '错误信息'
    })
  })
  // var data = await utils.node.getStreamData(ctx.req);
  // // const writer = fs.createWriteStream(path.resolve(__dirname, 'received.bin'));
  // fs.writeFile(path.resolve(__dirname, 'received.bin'), data);
  // console.log(data);
  // console.log(data.length);
  // // if (data.length > 1000) {
  //   // data = data.slice(0, 1000);
  // // }
  // console.log(data.toString());
  // ctx.type = 'application/octet-stream';
  // ctx.body = data;
});

  
module.exports = router;

// add router middleware:
// app.use(router.routes());

// app.listen(3001);

// const keysPath = busybox.utils.node.node.findClosestFile(__dirname, 'assets/files/https-keys');
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

