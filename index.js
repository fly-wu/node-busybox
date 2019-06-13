const fs = require('fs');
const path = require('path');
const Utils = require('./utils');

class BusyBox {
  constructor() {
    this.utils = new Utils(this);
    this.addModulesInDirNodeModules();
  }

  addModulesInDirNodeModules() {
    const MODULE_PATH = path.resolve(__dirname, 'node_modules');
    fs.readdirSync(MODULE_PATH)
      .filter(it => {
        const fullPath = path.resolve(MODULE_PATH, it);
        // only scan directory
        return !it.startsWith('.') && fs.statSync(fullPath).isDirectory()
      })
      .forEach(it => {
        const fullPath = path.resolve(MODULE_PATH, it);
        // console.log(`import model from file ${fullPath}...`);
        this[it] = require(fullPath);
      });
  }
}

module.exports = new BusyBox();