#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// read dir recursive. return all files in dir root
function readDirRecursive(root, filter, files, prefix) {
  prefix = prefix || ''
  files = files || []
  filter = filter || (x => x[0] !== '.')
  var dir = path.join(root, prefix)
  if (!fs.existsSync(dir)) return files
  if (fs.statSync(dir).isDirectory())
    fs.readdirSync(dir)
    .filter((name, index) => {
      return filter(name, index, dir)
    })
    .forEach(name => {
      readDirRecursive(root, filter, files, path.join(prefix, name))
    })
  else
    files.push(prefix)
  return files
}


module.exports = function linesCount(dir) {
  if (!dir) {
    dir = '.';
  }
  destDir = path.resolve(dir);

  console.log(`traverse dir ${destDir}`);
  // let files = fs.readdirSync(destDir);
  let files = readDirRecursive(destDir);
  console.log(files);

  let totalCount = 0;
  files.forEach(it => {
    let destFile = path.join(destDir, it);
    let content = fs.readFileSync(destFile);
    let lineCount = content.toString().split('\n').length;
    console.log(`${it}: ${lineCount}`);
    totalCount += lineCount;
  });

  console.log(`total: ${totalCount}`);
}