
const fs = require('fs');
const path = require('path');
const util = require('util');
const Koa = require('koa');
const router = require('koa-router')();
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

  }


}
