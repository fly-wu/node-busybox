const fs = require('fs');
const path = require('path');
const router = require('koa-router')();
const nodeUtils = new (require('../../utils/node'))();

router.post('/api/upload', async(ctx, next) => {
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
});


module.exports = router;