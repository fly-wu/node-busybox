const FEUtils = require('./fe.js');
const NodeUtils = require('./node.js');

class Utils {
  constructor() {
    this.fe = new FEUtils();
    this.node = new NodeUtils();
  }
}

module.exports = new Utils();