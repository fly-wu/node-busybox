const FEUtils = require('./fe.js');
const NodeUtils = require('./node.js');

class Utils {
  constructor(busybox) {
    this.fe = new FEUtils(busybox);
    this.node = new NodeUtils(busybox);
  }
}

module.exports = Utils;