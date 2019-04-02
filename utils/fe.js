const Common = require('./common.js');
class FEUtils  extends Common{
  constructor() {
    super();
  }

  /**
   *
   * @param type, javascript or css
   * @param name
   * @returns {*}
   */
  lazyLoad(type, path) {
    return new Promise((resolve, reject) => {
      if (!path) {
        reject({
          title: 'path parameter must be specified'
        });
        return;
      }

      var nodeToAdd = null;
      switch (type) {
        case 'js':
          nodeToAdd = document.createElement('script');
          nodeToAdd.type = 'text/javascript';
          nodeToAdd.charset = 'utf-8';
          nodeToAdd.async = true;
          nodeToAdd.timeout = 120000;
          nodeToAdd.src = path;
          break;
        case 'css':
          nodeToAdd = document.createElement('link');
          nodeToAdd.setAttribute('rel', 'stylesheet');
          nodeToAdd.setAttribute('type', 'text/css');
          nodeToAdd.setAttribute('href', path);
          nodeToAdd.setAttribute('media', 'all');
          break;
      }
      if (nodeToAdd === null) {
        reject(null);
      }
      if (this._lazyLoadFiles.hasOwnProperty(path)) {
        resolve(this._lazyLoadFiles[path]);
        return;
      }

      function onError(err) {
        nodeToAdd.onerror = nodeToAdd.onload = null;
        clearTimeout(timeout);
        console.log(err);
        reject(err);
      }

      var timeout = setTimeout(() => {
        onError({
          title: '请求超时'
        })
      }, 12000);
      nodeToAdd.onload = (evt) => {
        nodeToAdd.onerror = nodeToAdd.onload = null;
        clearTimeout(timeout);
        this._lazyLoadFiles[path] = nodeToAdd;
        resolve(nodeToAdd);
      };
      nodeToAdd.onerror = onError;
      document.head.appendChild(nodeToAdd);
    })
  }
}

module.exports = FEUtils;
