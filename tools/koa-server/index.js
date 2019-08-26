
const fs = require('fs');
const path = require('path');
const util = require('util');
const Koa = require('koa');
const router = require('koa-router')();
const formidable = require('formidable');
const staticCache = require('koa-static-cache');
const utils = require('../../utils');


// const debug = require('debug');
// debug.getState().setConfigs({
//   useColors: true,
//   debug: 'koa*'
// });
// console.log(debug.getState().getConfig());

module.exports = class KoaServer {
  constructor(options = {
    staticDir: null,
    uploadDir: null,
  }, provideService = {
    static: true,
    assets: false,
    assist: false
  }) {
    this.CURRENT_WORK_DIR = process.cwd();
    this.STATIC_DIR = options.staticDir ? (options.staticDir.startsWith('/') ? options.staticDir : path.resolve(this.CURRENT_WORK_DIR, options.staticDir)) : this.CURRENT_WORK_DIR;
    this.UPLOAD_DIR = options.uploadDir ? options.uploadDir : this.CURRENT_WORK_DIR;
    // dir check
    [this.STATIC_DIR, this.UPLOAD_DIR].forEach(dir => {
      var stats = fs.statSync(this.STATIC_DIR);
      if (!stats.isDirectory()) {
        throw new Error(`${dir} is not a directory`);
      }
    });
    console.log(util.inspect({
      staticDir: this.STATIC_DIR,
      uploadDir: this.UPLOAD_DIR
    }, {colors: true}));
    console.log(util.inspect(provideService, {colors: true}));
    
    this.provideService = provideService;
    
    this._httpServer = null;
    // 创建一个Koa对象表示web app本身:
    this.app = new Koa();
  }

  async start() {
    const port = await utils.node.getAFreePort();
    const origin = `http://127.0.0.1:${port}`;
    const app = new Koa();
    app.on('error', err => {
      console.log(err);
    });
    this.setStaticMiddleware(app);
    this.setAssistMiddleware(app);
    this.parseByFormidable(app);
    this.handlePost(app);
    app.listen(port);
    console.log(`started: ${origin}`);
    return app;
  }

  setStaticMiddleware(app) {
    const fileStore = {
      fileMap: {},
      get(key) {
        return this.fileMap[key];
      },
      set(key, value) {
        this.fileMap[key] = value;
      }
    };
    if (this.provideService.assets) {
      const dirList = utils.node.findFileListByNameUpward(__dirname, 'assets');
      dirList.forEach(it => {
        app.use(staticCache(it, {
          prefix: '/assets',
          // maxAge: 365 * 24 * 60 * 60,
          // buffer: true,
          dynamic: true,
          dirContent(stat) {
            return 'utils.node.getDirContentInFormOfHtml(stat.path)'
          }
        }, fileStore));
      });
    }

    if(this.provideService.static) {
      app.use(staticCache(this.STATIC_DIR, {
        // prefix: '',
        // maxAge: 365 * 24 * 60 * 60,
        // buffer: true,
        dynamic: true,
        dirContent(stat) {
          return utils.node.getDirContentInFormOfHtml(stat.path)
        }
      }));
    }

    // const fileListPath = path.resolve(process.cwd(), 'keys.txt');
    // fs.writeFileSync(fileListPath, '');
    // Object.keys(fileStore.fileMap).forEach(it => {
    //   fs.appendFileSync(fileListPath, `${it}\n`);
    // });
  }

  setAssistMiddleware(app) {
    if (!this.provideService.assist) {
      return;
    }
    app.use(staticCache(path.resolve(__dirname, 'assist'), {
      prefix: '/assist',
      // maxAge: 365 * 24 * 60 * 60,
      // buffer: true,
      // dynamic: true,
      dirContent(stat) {
        return utils.node.getDirContentInFormOfHtml(stat.path)
      }
    }));
    app.use(require('./assist/router').routes());
  }

  // parse body for all post, results is saved to ctx.request.body
  // ?save=true, save file or not
  parseByFormidable(app) {
    app.use(async(ctx, next) => {
      if (ctx.method !== 'POST' || !ctx.path.startsWith('/api')) return await next();

      const uploadDir = this.uploadDir;

      var form = new formidable.IncomingForm({
        uploadDir,
        keepExtensions: true,
        multiples: true,
        hash: 'md5'
      });

      const multipart = await new Promise((resolve, reject) => {
        // form.on('progress', (bytesReceived, bytesExpected) => {
        //   console.log(`${bytesReceived} / ${bytesExpected}`);
        // });
        form.parse(ctx.req, (err, fields, files) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              fields,
              files
            });
          }
        });
      });
      // console.log(multipart);

      var fileList = [];
      Object.keys(multipart.files).forEach(key => {
        fileList = fileList.concat(multipart.files[key]);
      });

      if (fileList.length > 0 && ctx.query['save']) {
        const uploadDir = path.resolve(this.UPLOAD_DIR, 'uploads');
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
      // console.log(fileList);

      const resBody = {};
      resBody.fields = multipart.fields;
      resBody.files = multipart.files;
      ctx.request.body = resBody;
      return await next();
    });
  }

  // default action for post, if request is not handle in previous middleware
  handlePost(app) {
    app.use(async(ctx, next) => {
      if (ctx.request.body) {
        ctx.type = 'json';
        ctx.body = ctx.request.body;
      } else {
        await next();
      }
    });
  }
}
