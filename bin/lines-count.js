#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const busybox = require('../');
const localUtils = busybox.utils.local;

var destDir = __dirname;
if (process.argv.length >= 3) {
  destDir = path.resolve(process.argv[2]);
}

console.log(`traverse dir ${destDir}`);
// let files = fs.readdirSync(destDir);
let files = localUtils.readDirRecursive(destDir);
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