const fs = require('fs');
const path = require('path');
const utils = require('./utils');

class BusyBox {
  constructor() {
    this.utils = utils;
    this.addModulesInDirNodeModules();
  }

  addModulesInDirNodeModules() {
    const NODE_MODULES_PATH = path.resolve(__dirname, 'node_modules');
    this.NODE_MODULES_PATH = NODE_MODULES_PATH;
    fs.readdirSync(NODE_MODULES_PATH)
      .filter(it => {
        const fullPath = path.resolve(NODE_MODULES_PATH, it);
        // only scan directory
        // return !it.startsWith('.') && fs.statSync(fullPath).isDirectory();
        return ['debug', 'formidable', 'axios', 'koa', 'koa-static-cache', 'json-format'].indexOf(it) > -1;
      })
      .forEach(it => {
        const fullPath = path.resolve(NODE_MODULES_PATH, it);
        // console.log(`import model from file ${fullPath}...`);
        this[it] = require(fullPath);
      });
  }
}

module.exports = new BusyBox();