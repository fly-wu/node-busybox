const nodeUtils = new (require('../../../utils/node'))();
const bytes = require('bytes');

class Test {
  getThreadInfoByPid() {
    const keys = ['pid', 'ppid', 'rss', 'vsz', 'pcpu', 'user', 'time', 'command'];
    async function showDetail() {
      const status = await nodeUtils.getThreadInfoByPid(process.pid);
      status.rss = bytes(parseInt(status.rss) * 1024);
      status.vsz = bytes(parseInt(status.vsz) * 1024);
      console.log(keys.map(it => status[it]).join('\t'));
    }
    console.log(keys.join('\t'));
    setInterval(showDetail, 1000);
  }

  deepMerge() {
    const obj1 = {
      a: 1,
      o: {
        aa: 4
      }
    };
    const obj2 = {
      b: 2,
      o: {
        bb: 6
      }
    };
    const obj3 = {
      c: 3,
      o: {
        bb: 8
      },
      f() {},
      d: new Date()
    }
    const obj = nodeUtils.deepMerge(obj1, obj2, obj3);
    console.log(obj1);
    console.log(obj2);
    console.log(obj);
  }
}

const obj = new Test();
// obj.getThreadInfoByPid();
obj.deepMerge();