// const busybox = {
//   utils: require('./utils'),
//   tools: require('./tools')
// }
const Utils = require('./utils');

class BusyBox {
  constructor() {
    this.utils = new Utils(this);
    this.b = 'b';
  }
  get v() {
    return 'a';
  }
}

module.exports = new BusyBox();