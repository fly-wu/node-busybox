#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readDirRecursive = require('fs-readdir-recursive');

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