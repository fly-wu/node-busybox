const busybox = require('../../../');
const nodeUtils = busybox.utils.node;
const bytes = busybox.bytes;

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
}

const obj = new Test();
obj.getThreadInfoByPid();