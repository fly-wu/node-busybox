
const LocalUtils = require('./local.js');
const ServerUtils = require('./net.js');

class Utils {
  constructor(busybox) {
    this.local = new LocalUtils(busybox);
    this.server = new ServerUtils(busybox);
  }
}

module.exports = Utils;