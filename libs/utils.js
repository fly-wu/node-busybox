class Utils {
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

module.exports = new Utils();