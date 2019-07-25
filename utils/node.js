const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const http = require('http');
const childProcess = require('child_process');
const stream = require('stream');

const Common = require('./common.js');
const HOME_PATH = process.env["HOME"];

module.exports = class NodeUtils extends Common {
  constructor(busybox) {
    super();
    this.busybox = busybox;
  }

  // 等待ms毫秒
  async waitMilliSeconds(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  }

  /**
   * start from @param 'dir', find one file with @param'name' upwards
   * @param dir, start dir
   * @param name, target file name
   */
  findClosestFile(dir, name) {
    let fullPath = path.resolve(dir, name);
    if (dir == HOME_PATH || dir == '/') {
      return null;
    }
    if (fs.existsSync(fullPath)) {
      return fullPath
    } else {
      return this.findClosestFile(path.resolve(dir, '..'), name)
    }
  }

  /**
   * start from @param 'dir', find file list with @param'name' upwards
   * @param dir, start dir
   * @param name, target file name
   */
  findFileListByNameUpward(dir, name) {
    var results = [];

    var currentPath = dir;
    while (currentPath !== HOME_PATH && currentPath !== '/' && currentPath !== null) {
      // console.log(currentPath);
      var toFind = path.resolve(currentPath, name);
      if (fs.existsSync(toFind)) {
        results.push(toFind);
      }
      currentPath = path.resolve(currentPath, '..')
    }

    return results;
  }

  // read dir recursive. return all files in dir root
  readDirRecursive(root, filter, files, prefix) {
    prefix = prefix || ''
    files = files || []
    filter = filter || (x => x[0] !== '.')
    var dir = path.join(root, prefix)
    if (!fs.existsSync(dir)) return files
    if (fs.statSync(dir).isDirectory())
      fs.readdirSync(dir)
      .filter((name, index) => {
        return filter(name, index, dir)
      })
      .forEach(name => {
        this.readDirRecursive(root, filter, files, path.join(prefix, name))
      })
    else
      files.push(prefix)
    return files
  }

  getModulePath(moduleName, currentPath) {
    const pathList = [];
    try {
      const globalDir = path.resolve(childProcess.execSync(`which node`).toString(), '../..', 'lib/node_modules');
      pathList.push(globalDir);
      pathList.push(path.resolve(currentPath, 'node_modules'));
      do {
        currentPath = path.resolve(currentPath, '..');
        if (!/.*node_modules$/.test(currentPath)) {
          pathList.push(path.resolve(currentPath, 'node_modules'));
        }
      } while (currentPath !== HOME_PATH)
    } catch(err) {
      console.log(err);
    }
    const fullPath = pathList.map(it => path.resolve(it, moduleName)).find(it => fs.existsSync(it));
    return fullPath;
  }

  /**
  process是一个全局变量，可以直接调用。
  process的属性，如下：
  version：包含当前node实例的版本号；
  installPrefix：包含安装路径；
  platform：列举node运行的操作系统的环境，只会显示内核相关的信息，如：linux2， darwin，而不是“Redhat ES3” ，“Windows 7”，“OSX 10.7”等；
  pid：获取进程id；
  title：设置进程名称；
  execPath：当前node进程的执行路径，如：/usr/local/bin/node；
  memoryUsage()：node进程内存的使用情况，rss代表ram的使用情况，vsize代表总内存的使用大小，包括ram和swap；
  heapTotal,process.heapUsed：分别代表v8引擎内存分配和正在使用的大小。
  argv：这是一个数组，数组里存放着启动这个node.js进程各个参数和命令代码；
  uptime()：包含当前进程运行的时长（秒）；
  getgid()：获取或者设置group id；
  setuid()：获取或者设计user id；
  cwd()：当前工作目录；
  exit(code=0)：kill当前进程；
  kill(pid, signal='SIGTERM')：发出一个kill信号给指定pid；
  nextTick(callback)：异步执行callback函数；
  umask([mask]) ：设置进程的user mask值；
  */
  getProcessInfo(p) {
    const results = {};
    [
      'version',    // 包含当前node实例的版本号；
      'release',    // 返回与当前发布相关的元数据对象
      'platform',   // 列举node运行的操作系统的环境，只会显示内核相关的信息，如：linux2， darwin，而不是“Redhat ES3” ，“Windows 7”，“OSX 10.7”等；
      'arch',       // 返回一个表示操作系统CPU架构的字符串，Node.js二进制文件是为这些架构编译的。 例如 'arm', 'arm64', 'x32', 或 'x64'
      'pid',        // 获取进程id
      'ppid',       // 获取父进程id
      'title',      // 设置进程名称
      'execPath',   // 当前node进程的执行路径，如：/usr/local/bin/node
      'arch',
    ].forEach(key => {
      results[key] = p[key];
    });
    [
      'memoryUsage',
      'cwd'
    ].forEach(key => {
      results[key] = p[key]();
    })
    return results;
  }

  // get stream returned by command
  spawnCmdPS() {
    var processLister;
    const props = ['pid', 'ppid', 'rss', 'vsz', 'pcpu', 'user', 'time', 'command'];
    if (process.platform === 'win32') {
      // win32 is not supported
      return [];
      // See also: https://github.com/nodejs/node-v0.x-archive/issues/2318
      // processLister = spawn('wmic.exe', ['PROCESS', 'GET', 'Name,ProcessId,ParentProcessId,Status']);
    } else {
      // ps -A -o 'pid,ppid,rss,vsz,pcpu,user,time,command'
      // pid:       process ID
      // ppid:      parent process ID
      // rss:       resident set size, 实际内存占用大小(单位killobytes)
      // vsz:       virtual size in Kbytes (alias vsize), 虚拟内存占用大小
      // pcup:      percentage CPU usage (alias pcpu)
      // command:   command and arguments  
      // time:      user + system
      processLister = childProcess.spawn('ps', ['-A', '-o', props.join(',')]);
    }
    return processLister;
  }
  // 获取所有进程的基本信息
  async getThreadsInfoAll() {
    const props = ['pid', 'ppid', 'rss', 'vsz', 'pcpu', 'user', 'time', 'command'];
    const processLister = this.spawnCmdPS();
    return new Promise((resolve, reject) => {
      const bufList = [];
      processLister.stdout.on('data', (data) => {
        bufList.push(data);
      });

      processLister.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
        reject(data);
      });

      processLister.on('close', (code) => {
        const data = Buffer.concat(bufList).toString();
        const threads = data.toString().split('\n');
        const threadsList = threads.slice(1).map(it => {
          const items = it.trim().split(/\s+/);
          const result = {};
          props.forEach((it, index) => {
            if (index == (props.length -1)) {
              result[it] = items.slice(index).join(' ');
            } else {
              result[it] = items[index];
            }
          });
          return result;
        });
        // console.log(threadsList);
        resolve(threadsList);
      });
    });
  }

  // kill pid and its childpid
  async killByPid(pid, killTree = true) {
    const threadsInfo = await this.getThreadsInfoAll();
    const mainThread = threadsInfo.find(it => it.pid == pid);
    if (!mainThread) {
      return Promise.reject(`no thread with pid ${pid}`);
    }
    const pidKilled = [];
    const kill = (thread) => {
      pidKilled.push(thread.pid);
      process.kill(thread.pid, 'SIGTERM');
    }
    const traverseFind = (thread) => {
      if (!thread.hasOwnProperty('children')) {
        var children = threadsInfo.filter(it => it.ppid == thread.pid);
        if (children.length > 0) {
          thread.children = children;
          children.forEach(traverseFind);
        }
      }
    }
    const traverseKill = (thread) => {
      if (thread.hasOwnProperty('children')) {
        thread.children.forEach(traverseKill);
        delete thread.children;
        traverseKill(thread);
      } else {
        kill(thread);
      }
    }
    if (killTree) {
      traverseFind(mainThread);
      traverseKill(mainThread);
    } else {
      kill(mainThread);
    }
    return pidKilled;
  }

  // 通过pid获取线程基本信息
  async getThreadInfoByPid(pid) {
    const threadsInfoList = await this.getThreadsInfoAll();
    return threadsInfoList.find(it => it.pid == pid);
  }

  defaultResponse(response) {
    response.writeHead(200, {
      'Content-Type': 'html'
    });
    fs.createReadStream(path.resolve(__dirname, 'net.html')).pipe(response);
  }

  getLocalIP() {
    var localIP = null;
    var ifaces = os.networkInterfaces();
    var keys = ['en0', 'en1', 'en2', 'en3', 'en4', 'en5', 'em0', 'em1', 'em2', 'em3', 'em4', 'em5', 'eth0'];
    let iface = [];
    keys.forEach(function(key) {
      if ((key in ifaces) && (Array.isArray(ifaces[key]))) {
        iface = ifaces[key];
      }
    });
    iface.forEach(function(iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        return;
      }
      localIP = iface.address;
    });
    return localIP;
  }

  // 获取一个未被使用的端口（从3000端口开始）
  async getAFreePort() {
    async function tryPort(port) {
      const server = net.createServer().listen(port);
      const result = await new Promise((resolve,reject) => {
        server.on('listening', () => {
          server.close();
          resolve(port);
        });
        server.on('error', err => {
          if (err.code === 'EADDRINUSE') {
            resolve(null);
          } else {
            resolve(err);
          }
        })
      });
      return result;
    }
    const START_PORT = 3000;
    var port = START_PORT;
    var result = await tryPort(port);
    while (result === null) {
      port += 1;
      result = await tryPort(port);
    }
    if (result instanceof Error) {
      result = null;
    }
    return result;
  }

  parseQueryString(qs, sep, eq, options) {
    sep = sep || '&';
    eq = eq || '=';
    var obj = {};
    if (typeof qs !== 'string' || qs.length === 0) {
      return obj;
    }
    try {
      var regexp = /\+/g;
      qs = qs.split(sep);
      var maxKeys = 1000;
      if (options && typeof options.maxKeys === 'number') {
        maxKeys = options.maxKeys;
      }
      var len = qs.length;
      // maxKeys <= 0 means that we should not limit keys count
      if (maxKeys > 0 && len > maxKeys) {
        len = maxKeys;
      }
      for (var i = 0; i < len; ++i) {
        var x = qs[i].replace(regexp, '%20'),
          idx = x.indexOf(eq),
          kstr, vstr, k, v;
        if (idx >= 0) {
          kstr = x.substr(0, idx);
          vstr = x.substr(idx + 1);
        } else {
          kstr = x;
          vstr = '';
        }
        k = decodeURIComponent(kstr);
        v = decodeURIComponent(vstr);
        if (!obj.hasOwnProperty(k)) {
          obj[k] = v;
        } else if (Array.isArray(obj[k])) {
          obj[k].push(v);
        } else {
          obj[k] = [obj[k], v];
        }
      }
    } catch (error) {
      console.log('error in parseQueryString:');
      console.log(error);
      obj = {};
    }
    return obj;
  }

  // return file list in the form of <ul><li></li></ul>
  getFileListInFormatOfUl(dir) {
    return new Promise((resolve, reject) => {
      try {
        const fileList = fs.readdirSync(dir);
        const liList = Array.prototype.slice.call(fileList).map((it) => {
          var item = '';
          // // pass hidden file
          // if (it.startsWith('.')) {
          //   return item;
          // }
          const statInfo = fs.statSync(dir + '/' + it);
          if (statInfo.isDirectory()) {
            // item = '<li><a href="' + it + '/">' + it + '/</a></li>';
            item = `<li><a href="${it}/">${it}/</a></li>`;
          } else if (statInfo.isFile()) {
            // item = '<li><a href="' + it + '">' + it + '</a></li>';
            item = `<li><a href="${it}">${it}</a></li>`;
          } else {
            // item = '<li style="color: red"><a href="' + it + '">' + it + '</a></li>';
            item = `<li style="color: red"><a href="${it}">${it}</a></li>`;
          }
          return item;
        });
        const ul = ['<ul>', ...liList, '</ul>'].join('');
        resolve(ul);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * response for a file or dir
   */
  async getFileStream4Response(targetFile) {
    if (!targetFile) {
      return null;
    }
    if (!fs.existsSync(targetFile)) {
      return null;
    }

    const statInfo = fs.statSync(targetFile);
    if (statInfo.isDirectory()) {
      const ul = await this.getFileListInFormatOfUl(targetFile);
      const body = `<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="initial-scale=1, width=device-width, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="">
    <title>文件列表</title>
    <script>
    window.addEventListener('load', function() {
    });
    </script>
    <style>
    </style>
  </head>
  <body>
    ${ul}
  </body>
</html>`;
      return new stream.Readable({
        read() {
          this.push(body);
          this.push(null);
        }
      });
    } else if (statInfo.isFile()) {
      return fs.createReadStream(targetFile);
    }
  }

  startBasicServer(cb) {
    let HTTPPORT = 0;
    let server = http.createServer((request, response) => {
      // this.showRequest(request);
      if (typeof(cb) !== 'function') {
        this.defaultResponse(response);
      } else {
        cb(request, response);
      }
    });
    server.listen(HTTPPORT);
    server.on('listening', () => {
      let port = server.address().port;
      let localIP = this.getLocalIP();
      console.log(`start at: http://${localIP}:${port}`);
    })
  }

  getParsedUrl(request) {
    // const 
    var urlString = 'http://' + request.headers['host'] + request.url;
    var obj = url.parse(urlString);
    if (obj.query) {
      obj.query = this.parseQueryString(obj.query);
    }
    return obj;
  }

  /**
   * @param {ctx}, ctx of koa
   * @param {next}, ctx of next
   * @param {prefix}, filter url started with prefix
   * @param {refDir}, the start dir from which to search target file
   */
  async koaMiddlewareResponseStatic(ctx, next, prefix, refDir = __dirname) {
    const url = ctx.url;

    if (url.startsWith(prefix)) {
      return await next();
    }
    const targetFile = this.findClosestFile(refDir, url.replace('/', ''));
    if (!targetFile) {
      return await next();
    }
    const statInfo = fs.statSync(targetFile);
    if (statInfo.isDirectory() && !url.endsWith('/')) {
      ctx.redirect(`${url}/`);
      return;
    }
    const resStream = await this.getFileStream4Response(targetFile);
    if (resStream) {
      if (statInfo.isDirectory()) {
        ctx.type = 'html';
      } else if (statInfo.isFile()) {
        ctx.type = targetFile.split('.').pop();
      }
      ctx.body = resStream;
    } else {
      return await next();
    }
  }

  getStreamData(req) {
    return new Promise((resolve, reject) => {
      var bufferList = [];
      req.on('data', function(chunk){
        // console.log(chunk);
        // result += chunk;
        bufferList.push(chunk);
      });
      req.on('end', function() {
        resolve(Buffer.concat(bufferList));
      });
      req.on('error', function(err) {
        reject(err);
      })
    })
  }
}
