const fs = require('fs');
const path = require('path');

class Common {
  constructor() {}

  // return file list in the form of <ul><li></li></ul>
  getFileListInFormatOfUl(dir) {
    return new Promise((resolve, reject) => {
      try {
        const fileList = fs.readdirSync(dir);
        const liList = Array.prototype.slice.call(fileList).map((it) => {
          var item = '';
          // // pass hidden file
          // if (it.startsWith('.')) {
          //   return item;
          // }
          const statInfo = fs.statSync(dir + '/' + it);
          if (statInfo.isDirectory()) {
            // item = '<li><a href="' + it + '/">' + it + '/</a></li>';
            item = `<li><a href="${it}/">${it}/</a></li>`;
          } else if (statInfo.isFile()) {
            // item = '<li><a href="' + it + '">' + it + '</a></li>';
            item = `<li><a href="${it}">${it}</a></li>`;
          } else {
            // item = '<li style="color: red"><a href="' + it + '">' + it + '</a></li>';
            item = `<li style="color: red"><a href="${it}">${it}</a></li>`;
          }
          return item;
        });
        const ul = ['<ul>', ...liList, '</ul>'].join('');
        resolve(ul);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Common;