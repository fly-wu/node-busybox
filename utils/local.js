const fs = require('fs');
const path = require('path');
const HOME_PATH = process.env["HOME"];

class LocalUtils {
  findFileUpwards(dir, name) {
    let fullPath = path.resolve(dir, name);
    if (dir == HOME_PATH || dir == '/') {
      return null;
    }
    if (fs.existsSync(fullPath)) {
      return fullPath
    } else {
      return findFileUpwards(path.resolve(dir, '..'), name)
    }
  }
}

module.exports = new LocalUtils();