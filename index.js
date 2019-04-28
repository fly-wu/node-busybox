const fs = require('fs');
const path = require('path');
const Utils = require('./utils');

class BusyBox {
  constructor() {
    this.utils = new Utils(this);
    this.addModulesInDirNodeModules();
  }

  addModulesInDirNodeModules() {
    fs.readdirSync(path.resolve(__dirname, 'node_modules')).filter(it => !it.startsWith('.')).forEach(it => {
      // console.log(`import model from file ${f}...`);
      this[it] = require(path.resolve(__dirname, `node_modules/${it}`));
    });
  }
}

module.exports = new BusyBox();