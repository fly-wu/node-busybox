const fs = require('fs');
const path = require('path');
const Common = require('./common.js');
const HOME_PATH = process.env["HOME"];

class LocalUtils extends Common {
  constructor() {
    super();
  }

  /**
   * start from @param 'dir', find one file with @param'name' upwards
   * @param dir, start dir
   * @param name, target file name
   */
  findClosestFile(dir, name) {
    let fullPath = path.resolve(dir, name);
    if (dir == HOME_PATH || dir == '/') {
      return null;
    }
    if (fs.existsSync(fullPath)) {
      return fullPath
    } else {
      return this.findClosestFile(path.resolve(dir, '..'), name)
    }
  }

  /**
   * start from @param 'dir', find file list with @param'name' upwards
   * @param dir, start dir
   * @param name, target file name
   */
  findFileListByNameUpward(dir, name) {
    var results = [];

    var currentPath = dir;
    while (currentPath !== HOME_PATH && currentPath !== '/' && currentPath !== null) {
      // console.log(currentPath);
      var toFind = path.resolve(currentPath, name);
      if (fs.existsSync(toFind)) {
        results.push(toFind);
      }
      currentPath = path.resolve(currentPath, '..')
    }

    return results;
  }
}

module.exports = LocalUtils;