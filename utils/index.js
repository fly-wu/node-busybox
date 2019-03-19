
const LocalUtils = require('./local.js');
const ServerUtils = require('./server.js');

class Utils {
  constructor(busybox) {
    this.local = new LocalUtils(busybox);
    this.server = new ServerUtils(busybox);
  }
}

module.exports = Utils;