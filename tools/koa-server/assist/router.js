const fs = require('fs');
const path = require('path');
const stream = require('stream');
const Koa = require('koa');

// NOTICE: 
const utils = require('../../../utils');

// 注意require('koa-router')返回的是函数:
const router = require('koa-router')();

// common get
router.get('/api/test/get/common', async(ctx, next) => {
  let req = ctx.req; // 原request
  let res = ctx.res; // 原response
  const type = ctx.query.type;
  const feature = ctx.query.feature;

  const getStreamByType = (type) => {
    var body = null;
    switch (type) {
      case 'xml':
        ctx.type = 'xml';
        body = utils.node.toStream('<div>this is a div</div>');
        break;
      case 'png':
        ctx.type = 'png';
        // console.log(busyboxUtils.node.findClosestFile(__dirname, 'assets/imgs/pic1.jpg'));
        body = fs.createReadStream(busyboxUtils.node.findClosestFile(__dirname, 'assets/imgs/gnu-icon-small.png'));
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
  
  var body = getStreamByType(type ? type : 'js');
  switch(feature) {
    case 'slow':
      const slowTransform = utils.node.getSlowTransform();
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
});


router.post('/api/test/post/normal', async(ctx, next) => {
  var data = await utils.node.getStreamData(ctx.req);
  // console.log(data);
  // console.log(data.length);
  if (data.length > 1000) {
    data = data.slice(0, 1000);
  }
  console.log(data.toString());
  // console.log(ctx.req.headers["cookie"]);
  ctx.type = 'json';
  ctx.body = data;
});


router.post('/api/test/post/bin', async(ctx, next) => {
  var data = await utils.node.getStreamData(ctx.req);
  // const writer = fs.createWriteStream(path.resolve(__dirname, 'received.bin'));
  fs.writeFile(path.resolve(__dirname, 'received.bin'), data);
  console.log(data);
  console.log(data.length);
  // if (data.length > 1000) {
    // data = data.slice(0, 1000);
  // }
  console.log(data.toString());
  ctx.type = 'application/octet-stream';
  ctx.body = data;
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


router.all('/api/test/echo', async(ctx, next) => {
  const buf = await utils.node.getStreamData(ctx.req);
  // console.log(ctx.req.headers)
  // console.log(buf.toString());
  ctx.type = 'json';
  ctx.body = {
    general: `${ctx.method} ${ctx.path} ${ctx.protocol}`,
    url: ctx.url,
    headers: ctx.headers,
    body: buf.toString()
  };
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

