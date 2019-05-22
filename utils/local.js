const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const Common = require('./common.js');
const HOME_PATH = process.env["HOME"];

class LocalUtils extends Common {
  constructor() {
    super();
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

  // 获取所有进程的基本信息
  async getThreadsInfoAll() {
    var processLister;
    const props = ['pid', 'ppid', 'rss', 'vsz', 'pcpu', 'command', 'user', 'time'];
    if (process.platform === 'win32') {
      // win32 is not supported
      return [];
      // See also: https://github.com/nodejs/node-v0.x-archive/issues/2318
      // processLister = spawn('wmic.exe', ['PROCESS', 'GET', 'Name,ProcessId,ParentProcessId,Status']);
    } else {
      // ps -A -o 'pid,ppid,rss,vsz,pcpu,command,user,time'
      // pid:       process ID
      // ppid:      parent process ID
      // rss:       resident set size, 实际内存占用大小(单位killobytes)
      // vsz:       virtual size in Kbytes (alias vsize), 虚拟内存占用大小
      // pcup:      percentage CPU usage (alias pcpu)
      // command:   command and arguments  
      // time:      user + system
      processLister = childProcess.spawn('ps', ['-A', '-o', props.join(',')]);
    }

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

  // 通过pid获取线程基本信息
  async getThreadInfoByPid(pid) {
    const threadsInfoList = await this.getThreadsInfoAll();
    return threadsInfoList.find(it => it.pid == pid);
  }

}

module.exports = LocalUtils;