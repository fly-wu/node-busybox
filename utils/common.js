
/**
 * common js code can be used on both browser and node
 */
class Common {
  constructor() {
    this._lazyLoadFiles = {};
    this.regMap = {
      mail: /^([\w-_]+(?:\.[\w-_]+)*)@((?:[a-z0-9]+(?:-[a-zA-Z0-9]+)*)+\.[a-z]{2,6})$/,
      ipOnly: /^([0-2]*[0-9]{1,2})\.([0-2]*[0-9]{1,2})\.([0-2]*[0-9]{1,2})\.([0-2]*[0-9]{1,2})$/,
      ipWithMask: /^([0-2]*[0-9]{1,2})\.([0-2]*[0-9]{1,2})\.([0-2]*[0-9]{1,2})\.([0-2]*[0-9]{1,2})(\/[0-9]+)?$/,
      number: /^[0-9]+$/
    }
  }
  getReg(type) {
    let result = null;
    if (this.regMap.hasOwnProperty(type)) {
      result = this.regMap[type];
    }
    return result;
  }

  isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  isInteger(n) {
    return Number.isInteger(n);
  }

  isString(s) {
    return typeof(s) === 'string' || s instanceof String;
  }

  isDate(n) {
    return n instanceof Date;
  }

  isObject(value) {
    var type = typeof value;
    return value != null && (type == 'object' || type == 'function');
  }

  isRegExp(obj) {
    return obj instanceof RegExp
  }

  escapeRegexp(str) {
    if (typeof str !== 'string') {
      throw new TypeError('Expected a string');
    }
    return String(str).replace(/([.*+?=^!:${}()|[\]\/\\])/g, '\\$1');
  }

  /**
   * Check if the given variable is a function
   * @method
   * @memberof Popper.Utils
   * @argument {Any} functionToCheck - variable to check
   * @returns {Boolean} answer to: is a function?
   */
  isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
  }

  /**
   * transfer to formated date string
   * @date timestamp of date
   * @fmt the format of result, such as yyyy-MM-dd hh:mm:ss
   */
  formatDate(date, fmt) {
    if (!date) {
      return '未知';
    }
    if (!this.isDate(date)) {
      if (this.isString(date)) {
        date = parseInt(date);
      }
      if (this.isNumber(date)) {
        date = new Date(date);
      }
    }
    // console.log('date');
    // console.log(date);
    var o = {
      'M+': date.getMonth() + 1, //月份
      'd+': date.getDate(), //日
      'h+': date.getHours(), //小时
      'm+': date.getMinutes(), //分
      's+': date.getSeconds(), //秒
      'q+': Math.floor((date.getMonth() + 3) / 3), //季度
      'S': date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
      }
    }
    return fmt;
  }

  // error will occur when this function is called
  fix() {
    Object.prototype.renameProperty = function(oldName, newName) {
      // Do nothing if the names are the same
      if (oldName == newName) {
        return this;
      }
      // Check for the old property name to avoid a ReferenceError in strict mode.
      if (this.hasOwnProperty(oldName)) {
        this[newName] = this[oldName];
        delete this[oldName];
      }
      return this;
    };
  }

  renameProperty(obj, old_key, new_key) {
    if (old_key !== new_key) {
      Object.defineProperty(obj, new_key,
        Object.getOwnPropertyDescriptor(obj, old_key));
      delete obj[old_key];
    }
  }

  theSame(value1, value2) {
    return JSON.stringify(value1) === JSON.stringify(value2);
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

  /**
   * format url-model with options
   * @param format, '/application/authorization/targetGroup/{groupID}/targetApplication'
   * @param options, {groupID: 5}
   * @returns {*}, /application/authorization/targetGroup/5/targetApplication
   */
  formatUrl(format, options) {
    for (let key in options) {
      let regStr = '\\{' + key + '\\}';
      let reg = new RegExp(regStr);
      let value = options[key];
      format = format.replace(reg, value);
    }
    return format
  }

  /*
   * 频率控制 返回函数连续调用时，fn 执行频率限定为每多少时间执行一次
   * @param fn {function}  需要调用的函数
   * @param delay  {number}    延迟时间，单位毫秒
   * @param immediate  {bool} 给 immediate参数传递false 绑定的函数先执行，而不是delay后后执行。
   * @return {function}实际调用函数
   */
  throttle(fn, delay, immediate, debounce) {
    var curr = +new Date(), //当前事件
      last_call = 0,
      last_exec = 0,
      timer = null,
      diff, //时间差
      context, //上下文
      args,
      exec = function() {
        last_exec = curr;
        fn.apply(context, args);
      };
    return function() {
      curr = +new Date();
      context = this,
        args = arguments,
        diff = curr - (debounce ? last_call : last_exec) - delay;
      clearTimeout(timer);
      if (debounce) {
        if (!immediate) {
          timer = setTimeout(exec, delay);
        } else if (diff >= 0) {
          exec();
        }
      } else {
        if (diff >= 0) {
          exec();
        } else if (!immediate) {
          timer = setTimeout(exec, -diff);
        }
      }
      last_call = curr;
    }
  }

  /*
   * 空闲控制 返回函数连续调用时，空闲时间必须大于或等于 delay，fn 才会执行
   * @param fn {function}  要调用的函数
   * @param delay   {number}    空闲时间
   * @param immediate  {bool} 给 immediate参数传递false 绑定的函数先执行，而不是delay后后执行。
   * @return {function}实际调用函数
   */
  debounce(fn, delay, immediate) {
    return this.throttle(fn, delay, immediate, true);
  }

  cloneDeep(origin) {
    if (window._) {
      return _.cloneDeep.apply(_, arguments);
    }
    if (this.isObject(origin)) {
      return JSON.parse(JSON.stringify(origin));
    } else {
      return origin;
    }
  }

  /**
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

  hasProps(obj, ...props) {
    let result = true;
    props.every(prop => {
      result = obj.hasOwnProperty(prop);
      return result;
    });
    return result;
  }
}

module.exports = Common;