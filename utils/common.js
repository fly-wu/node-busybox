(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.CommonUtils = factory();
  }
}(this, function() {
  const toString = Object.prototype.toString;
  /**
   * property of current class can be used on both browser and node
   */
  return class {
    constructor() {
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

    isNumber(val) {
      return typeof val === 'number';
    }
    // isNumber(n) {
    //   return !isNaN(parseFloat(n)) && isFinite(n);
    // }

    isInteger(n) {
      return Number.isInteger(n);
    }

    isString(s) {
      return typeof(s) === 'string' || s instanceof String;
    }

    isDate(val) {
      return toString.call(val) === '[object Date]';
    }
    // isDate(n) {
    //   return n instanceof Date;
    // }

    isFile(val) {
      return toString.call(val) === '[object File]';
    }

    isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    isBuffer(obj) {
      return obj != null && obj.constructor != null &&
        typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
    }


    // isObject(value) {
    //   var type = typeof value;
    //   return value != null && (type == 'object' || type == 'function');
    // }
    isObject(val) {
      return val !== null && typeof val === 'object';
    }
    isPlainObject(obj) {
      var hasOwn = Object.prototype.hasOwnProperty;
      var toStr = Object.prototype.toString;
      if (!obj || toStr.call(obj) !== '[object Object]') {
        return false;
      }

      var hasOwnConstructor = hasOwn.call(obj, 'constructor');
      var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
      // Not own constructor property must be Object
      if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
        return false;
      }

      // Own properties are enumerated firstly, so to speed up,
      // if last one is own, then all properties are own.
      var key;
      for (key in obj) { /**/ }

      return typeof key === 'undefined' || hasOwn.call(obj, key);
    }


    isRegExp(obj) {
      return obj instanceof RegExp
    }

    isUndefined(val) {
      return typeof val === 'undefined';
    }

    isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    isStream(val) {
      return this.isObject(val) && this.isFunction(val.pipe);
    }

    isArray(arr) {
      if (typeof Array.isArray === 'function') {
        return Array.isArray(arr);
      }
      return toString.call(arr) === '[object Array]';
    }

    isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    escapeRegexp(str) {
      if (typeof str !== 'string') {
        throw new TypeError('Expected a string');
      }
      return String(str).replace(/([.*+?=^!:${}()|[\]\/\\])/g, '\\$1');
    }

    getUid() {
      function rid() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      }
      return `${rid()}_${rid()}_${rid()}_${rid()}_${Date.now()}`
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

    // copy from node module shvl
    shvlGet (object, path, def) {
      return (object = (path.split ? path.split('.') : path).reduce(function (obj, p) {
        return obj && obj[p]
      }, object)) === undefined ? def : object;
    }
    shvlSet  (object, path, val, obj) {
      return ((path = path.split ? path.split('.') : path).slice(0, -1).reduce(function (obj, p) {
        return obj[p] = obj[p] || {};
      }, obj = object)[path.pop()] = val), object;
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

    // TODO: not stable
    renameProperty(obj, old_key, new_key) {
      if (old_key !== new_key) {
        Object.defineProperty(obj, new_key,
          Object.getOwnPropertyDescriptor(obj, old_key));
        delete obj[old_key];
      }
    }

    // TODO: not stable
    theSame(value1, value2) {
      return JSON.stringify(value1) === JSON.stringify(value2);
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

    /** date related handler */
    formatMilliSeconds(ms) {
      const ss = 1000;
      const mi = ss * 60;
      const hh = mi * 60;
      const dd = hh * 24;

      const floatToInt = (v) => {
        return Math.floor(v);
      }

      var day = floatToInt(ms / dd);
      var hour = floatToInt((ms - day * dd) / hh);
      var minute = floatToInt((ms - day * dd - hour * hh) / mi);
      var second = floatToInt((ms - day * dd - hour * hh - minute * mi) / ss);
      var milliSecond = floatToInt(ms - day * dd - hour * hh - minute * mi - second * ss);

      var timeList = [];
      if(day > 0) {
        timeList.push(`${day}天`);
      }
      if(hour > 0) {
        timeList.push(`${hour}小时`);
      }
      if(minute > 0) {
        timeList.push(`${minute}分`);
      }
      if(second > 0) {
        timeList.push(`${second}秒`);
      }
      if(milliSecond > 0) {
        timeList.push(`${milliSecond}毫秒`);
      }
      return timeList.join('');
    }

    formatSeconds(ms) {
      const ss = 1000;
      const mi = ss * 60;
      const hh = mi * 60;
      const dd = hh * 24;

      const floatToInt = (v) => {
        return Math.floor(v);
      }

      var day = floatToInt(ms / dd);
      var hour = floatToInt((ms - day * dd) / hh);
      var minute = floatToInt((ms - day * dd - hour * hh) / mi);
      var second = floatToInt((ms - day * dd - hour * hh - minute * mi) / ss);

      var timeList = [];
      if(day > 0) {
        timeList.push(`${day}天`);
      }
      if(hour > 0) {
        timeList.push(`${hour}小时`);
      }
      if(minute > 0) {
        timeList.push(`${minute}分`);
      }
      if(second > 0) {
        timeList.push(`${second}秒`);
      }
      return timeList.join('');
    }

    // get Date from DateTime or timeStamp
    getDate(dateOrLong) {
      var result = dateOrLong;
      if (!(dateOrLong instanceof Date)) {
        result = new Date(dateOrLong);
      }
      result.setHours(0);
      result.setMinutes(0);
      result.setSeconds(0);
      result.setMilliseconds(0);
      return result.getTime();
    }
    getDate2(dt) {
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    }

    // get day interval for two date
    getDaysInterval(current, target) {
      const ONE_DAY = 24 * 3600 * 1000;
      return parseInt((this.getDate(target) - this.getDate(current)) / ONE_DAY);
    }

    /**
     * transfer to formated date string
     * @date timestamp of date
     * @fmt the format of result, such as yyyy-MM-dd hh:mm:ss.SSS
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
      var o = {
        'M+': date.getMonth() + 1, //月份
        'd+': date.getDate(), //日
        'h+': date.getHours(), //小时
        'm+': date.getMinutes(), //分
        's+': date.getSeconds(), //秒
        'q+': Math.floor((date.getMonth() + 3) / 3), //季度
        'S+': date.getMilliseconds() //毫秒
      };
      if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
      }
      for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
          if (k === 'S+') {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('000' + o[k]).substr(('' + o[k]).length)));
          } else {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
          }
        }
      }
      return fmt;
    }
    /** end of date related handler */


    // TODO: not stable
    hasProps(obj, ...props) {
      let result = true;
      return props.every(prop => {
        return obj.hasOwnProperty(prop);
      });
    }
    /**
     * check if path exist in obj
     * @param {obj}, object
     * @param {path}, a.b.c
     */
    propExists(obj, path) {
      var value = path.split('.').reduce((obj, prop) => {
        return obj && obj.hasOwnProperty(prop) ? obj[prop] : undefined;
      }, obj);
      return value !== undefined;
    }

    // 等待ms毫秒
    async waitAMoment(ms) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, ms);
      });
    }

    // convert string to key
    toIdentifier (str) {
      return str
        .split(' ')
        .map(function (token) {
          return token.slice(0, 1).toUpperCase() + token.slice(1)
        })
        .join('')
        .replace(/[^ _0-9a-z]/gi, '')
    }

    parseQueryString(qs, sep, eq, options) {
      if (qs.indexOf('?') > -1) {
        qs = qs.split('?').pop();
      }
      sep = sep || '&';
      eq = eq || '=';
      var obj = {};
      if (typeof qs !== 'string' || qs.length === 0) {
        return obj;
      }
      try {
        var regexp = /\+/g;
        qs = qs.split(sep);
        var maxKeys = 1000;
        if (options && typeof options.maxKeys === 'number') {
          maxKeys = options.maxKeys;
        }
        var len = qs.length;
        // maxKeys <= 0 means that we should not limit keys count
        if (maxKeys > 0 && len > maxKeys) {
          len = maxKeys;
        }
        for (var i = 0; i < len; ++i) {
          var x = qs[i].replace(regexp, '%20'),
            idx = x.indexOf(eq),
            kstr, vstr, k, v;
          if (idx >= 0) {
            kstr = x.substr(0, idx);
            vstr = x.substr(idx + 1);
          } else {
            kstr = x;
            vstr = '';
          }
          k = decodeURIComponent(kstr);
          v = decodeURIComponent(vstr);
          if (!obj.hasOwnProperty(k)) {
            obj[k] = v;
          } else if (Array.isArray(obj[k])) {
            obj[k].push(v);
          } else {
            obj[k] = [obj[k], v];
          }
        }
      } catch (error) {
        console.log('error in parseQueryString:');
        console.log(error);
        obj = {};
      }
      return obj;
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (this.isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (typeof result[key] === 'object' && typeof val === 'object') {
          result[key] = merge(result[key], val);
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        this.forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Function equal to merge with the difference being that no reference
     * to original objects is kept.
     *
     * @see merge
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    deepMerge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      const assignValue = (val, key) => {
        if (typeof result[key] === 'object' && typeof val === 'object') {
          result[key] = this.deepMerge(result[key], val);
        } else if (typeof val === 'object') {
          result[key] = this.deepMerge({}, val);
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        this.forEach(arguments[i], assignValue);
      }
      return result;
    }
  }
}));

