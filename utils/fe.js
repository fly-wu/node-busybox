(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory('cmd');
  } else {
    // Browser globals (root is window)
    factory('browser').then(util => {
      root.FEUtils = util;
    }).catch(err => {
      console.log(err);
    });
  }
}(this, function(mode) {
  class FEUtils {
    constructor() {
      this._lazyLoadFiles = {};
    }

    /**
     * @return Promise, ip list
     */
    async getLocalIPList() {
      return new Promise((resolve, reject) => {
        var ips = [];
        var RTCPeerConnection = window.RTCPeerConnection ||
          window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
        var pc = new RTCPeerConnection({
          // Don't specify any stun/turn servers, otherwise you will
          // also find your public IP addresses.
          iceServers: []
        });
        // Add a media line, this is needed to activate candidate gathering.
        pc.createDataChannel('');
        // onicecandidate is triggered whenever a candidate has been found.
        pc.onicecandidate = function(e) {
          if (!e.candidate) {
            // Candidate gathering completed.
            resolve(ips);
            return;
          }
          var ip = /^candidate:.+ (\S+) \d+ typ/.exec(e.candidate.candidate)[1];
          if (ips.indexOf(ip) == -1) // avoid duplicate entries (tcp/udp)
            ips.push(ip);
        };
        pc.createOffer(function(sdp) {
          pc.setLocalDescription(sdp);
        }, function onerror() {
          reject();
        });
        // 最多等待5秒
        setTimeout(() => {
          reject();
        }, 5000);
      })
    }

    /**
     * used only in front-end, as window.location.search is used
     * @param e the key in queryString, such as id in 'http://...?id=12'
     * @returns {null} the value of key
     */
    getQueryString(e) {
      var t = new RegExp('(^|&)' + e + '=([^&]*)(&|$)', 'i'),
        n = window.location.search.substr(1).match(t);
      if (null !== n) {
        var o = n[2];
        return o = o.replace(/(%22|%3E|%3C|<|>)/g, 'MM'), '' === o ? null : decodeURIComponent(o);
      }
      return null;
    }

    onWindowVisibilityChange(cb) {
      // 各种浏览器兼容
      var hidden, state, visibilityChange;
      if (typeof document.hidden !== "undefined") {
        hidden = "hidden";
        visibilityChange = "visibilitychange";
        state = "visibilityState";
      } else if (typeof document.mozHidden !== "undefined") {
        hidden = "mozHidden";
        visibilityChange = "mozvisibilitychange";
        state = "mozVisibilityState";
      } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
        state = "msVisibilityState";
      } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
        state = "webkitVisibilityState";
      }
      document.addEventListener(visibilityChange, function(event) {
        cb(event);
      }, false);
    }

    /**
     *
     * @param type, javascript or css
     * @param name
     * @returns {*}
     */
    async lazyLoad(type, path) {
      return new Promise((resolve, reject) => {
        if (!path) {
          reject({
            title: 'path parameter must be specified'
          });
          return;
        }

        var nodeToAdd = document.querySelector(`script[src="${path}"]`);
        if (nodeToAdd) {
          this._lazyLoadFiles[path] = nodeToAdd;
        }
        if (this._lazyLoadFiles.hasOwnProperty(path)) {
          resolve(this._lazyLoadFiles[path]);
          return;
        }

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

    /**
     * TODO: not stable
     * parameter of queryString and hash will overwrite value parsed from fullPath
     * @param fullPath, fullPath with queryString and hash, or pathname only,
     * @param queryString
     * @param hash
     */
    goToPath(fullPath, options) {
      let reg = /(\/[\w\-\/]+)(\?[\w\-\/=]+)?(#[\w\-\/\u4e00-\u9fa5]+)?/;
      let execResult = reg.exec(fullPath);
      if (!execResult) {
        console.log(`fullPath: ${fullPath} is not valid`);
        return;
      }
      let pathname = null;
      let queryString = null;
      let hash = null;
      let target = null;
      if (options) {
        queryString = options.queryString;
        hash = options.hash;
        target = options.target;
      }
      if (execResult.length === 4) {
        pathname = execResult[1];
        if (!queryString) {
          queryString = execResult[2];
        }
        if (!hash) {
          hash = execResult[3];
        }
      }
      if (!window || !window.location) {
        console.err('window.location not found');
      }
      // if (process.env.NODE_ENV === 'dev') {
      //   pathname = pathname + '.html';
      // }
      if (queryString) {
        pathname += queryString;
      }
      if (hash) {
        pathname += hash;
      }
      // console.log(fullPath);
      // console.log(window.location.origin + pathname);
      let destUrl = window.location.origin + pathname;
      if (target === '_blank') {
        window.open(destUrl, '_blank');
      } else {
        window.location.href = destUrl;
      }
    }
  }

  var CommonUtils = null;
  if (mode == 'browser') {
    return new Promise((resolve, reject) => {
      const utils = new FEUtils();
      utils.lazyLoad('js', '/assets/js/utils/common.js').then(node => {
        if (CommonUtils) {
          FEUtils.prototype.__proto__ = new CommonUtils();
        }
        resolve(FEUtils);
      }).catch(err => {
        reject(err);
      });
    });
  } else if (mode == 'cmd') {
    CommonUtils = require('./common');
    if (CommonUtils) {
      FEUtils.prototype.__proto__ = new CommonUtils();
    }
    return FEUtils;
  }
}))

