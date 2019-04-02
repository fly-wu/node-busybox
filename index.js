// const busybox = {
//   utils: require('./utils'),
//   tools: require('./tools')
// }
const Utils = require('./utils');

class BusyBox {
  constructor() {
    this.utils = new Utils(this);
  }
}

module.exports = new BusyBox();