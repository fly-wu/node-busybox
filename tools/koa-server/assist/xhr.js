/**
参考资料：
《Java权威指南》
https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest

*/
/**
一个HTTP请求由四部分组成：
1. HTTP请求方法或动作
2. 正在请求的URL
3. 一个可选的请求头集合，其中可能包含身份验证信息
4. 一个可选的请求体

服务器返回的HTTP响应包含三个部分：
1. 一个数字和文字组成的状态码，用来显示请求成功或失败
2. 一个响应头集合
3. 响应主体
*/

/**
顺序问题：
HTTP请求的各部分有制定顺序：
1. 请求方法和URL先到达
2. 请求头
3. 请求主体
XMLHttpRequest实现通常直到调用send()方法才开始启动网络。
XMLHttpRequest API的设计似乎使每个方法都写入网络流，这意味着调用XMLHttpRequest方法的顺序必须匹配HTTP请求的架构。
如，
setRequestHeader应该在open之后，send之前
*/

/**
你不能自己指定，XMLHttpRequest自动添加这些头：
Content-Length, Date, Referer, User-Agent
类似的，XMLHttpRequest对象自己处理cookie，连接时间，字符集，编码判断，所有你无法向setRequestHeader传递这些头：
Accept-Charset
Accept-Encoding
Connection
Content-Length
Cookie
Cookie2
Content-Transfer-Encoding
Date
Expect
Host
Keep-Alive
Referer
TE
Trailer
Transfer-Encoding
Upgrade
User-Agent
Via
*/

/**
responseType
The XMLHttpRequest property responseType is an enumerated string value specifying the type of data contained in the response. It also lets the author change the response type. If an empty string is set as the value of responseType, the default value of "text" is used.
values: '': text, arraybuffer, blob, document, json, text

如果responseType为arraybuffer, 
在读request.responseText会报错：
Uncaught DOMException: Failed to read the 'responseText' property from 'XMLHttpRequest': 
The value is only accessible if the object's 'responseType' is '' or 'text' (was 'arraybuffer').
在读request.responseXML会报错：
Failed to read the 'responseXML' property from 'XMLHttpRequest':
The value is only accessible if the object's 'responseType' is '' or 'document' (was 'arraybuffer').
*/

/**
XMLHttpRequest.status

The read-only XMLHttpRequest.status property returns the numerical HTTP status code of the XMLHttpRequest's response.
Before the request completes, the value of status is 0. Browsers also report a status of 0 in case of XMLHttpRequest errors.
*/

/**
XMLHttpRequest.properties
XMLHttpRequest.timeout:
is an unsigned long(time in milliseconds) representing the number of milliseconds a request can take before automatically being terminated. The default value is 0, which means there is no timeout.
*/
/**
XMLHttpRequest.event

request.onprogress, 上传速度
request.upload.onprogress, 下载进度
*/
class XHRAction {
  constructor() {}

  requestMethods(url, action) {
    const request = this.readystatechange(url);
    switch (action) {
      case 'abort':
      setTimeout(() => {
        request.abort();
      }, 3000);
      break;
    }
  }

  showResponse(request) {
    if (request.responseType === '' || request.responseType === 'text') {
      console.log('responseText');
      console.log(request.responseText);
    }
    if (request.responseType === 'document') {
      console.log('responseXML');
      console.log(request.responseXML);
    }
    console.log('response');
    console.log(request.response);
  }
  /**
    UNSENT            0     open()尚未使用
    OPENED            1     open()已调用
    HEADERS_RECEIVED  2     收到头部信息
    LOADING           3     接收到响应主体
    DONE              4     响应完成
    */
  readystatechange(url = '/api/test/get/common?type=js&feature=slow') {
    const request = new XMLHttpRequest();
    request.open('GET', url);

    const query = this.parseQueryString(url.split('?').pop());
    
    // responseType赋值需要注意
    request.responseType = {
      xml: 'document',
      js: 'text',
      jpg: 'arraybuffer',
      png: 'arraybuffer',
    }[query.type];
    console.log(`request.responseType: ${request.responseType}`);

    request.onreadystatechange = () => {
      console.log(request.readyState);
      if (request.readyState === 2) {
        console.log('getAllResponseHeaders');
        console.log(request.statusText);
        console.log(request.getAllResponseHeaders());
      }
      if (request.readyState === 3) {
        this.showResponse(request);
      }
      if (request.readyState === 4 && request.status === 200) {
        const type = request.getResponseHeader('Content-Type');
        console.log(type);
        console.log(request.statusText);
        this.showResponse(request);
      }
    }
    request.onerror = function(err) {
      console.log('onerror');
    }
    request.onabort = function(err) {
      console.log('onabort');
    }
    request.ontimeout = function(err) {
      console.log('ontimeout');
    }
    request.onload = function(err) {
      console.log('onload');
    }
    request.send(null);
    return request;
  }

  /*
  　* xhr.readyState：XMLHttpRequest对象的状态，等于4表示数据已经接收完毕。
　　* xhr.status：服务器返回的状态码，等于200表示一切正常。
　　* xhr.responseText：服务器返回的文本数据
　　* xhr.responseXML：服务器返回的XML格式的数据
　　* xhr.statusText：服务器返回的状态文本。
  */
  getCommon(url) {
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.onreadystatechange = () => {
      if (request.status === 0) {
        return;
      }
      if (request.readyState === 4 && request.status === 200) {
        const type = request.getResponseHeader('Content-Type');
        this.showResponse(request);
      }
    }
    request.onerror = function(err) {
      console.log('onerror');
    }
    request.onabort = function(err) {
      console.log('onabort');
    }
    request.ontimeout = function(err) {
      console.log('ontimeout');
    }
    request.onload = function(err) {
      console.log('onload');
    }
    request.send(null);
    // request.send('fdsfd');
  }

  getSlow() {
    const request = new XMLHttpRequest();
    request.open('GET', '/api/test/get/common?feature=slow');
    request.onreadystatechange = () => {
      console.log(request.readyState);
      if (request.readyState === 2) {
        console.log('getAllResponseHeaders');
        console.log(request.statusText);
        console.log(request.getAllResponseHeaders());
      }
      if (request.readyState === 3) {
        this.showResponse(request);
      }
      if (request.readyState === 4 && request.status === 200) {
        const type = request.getResponseHeader('Content-Type');
        console.log(type);
        console.log(request.statusText);
        this.showResponse(request);
      }
    }
    request.onprogress = function(e) {
      console.log(e);
    }
    request.onerror = function(err) {
      console.log('onerror');
    }
    request.onabort = function(err) {
      console.log('onabort');
    }
    request.ontimeout = function(err) {
      console.log('ontimeout');
    }
    request.onload = function(err) {
      console.log('onload');
    }
    request.send(null);
  }

  // 服务器没有response，XMLHttpRequest会如何处理
  getLongWait() {
    var count = 0;
    const intervalTag = setInterval(() => {
      console.log(`consume: ${++count}s`);
    }, 1000);

    const request = new XMLHttpRequest();
    request.open('GET', '/api/test/get/common?feature=long-wait');
    request.onreadystatechange = () => {
      console.log(request.readyState);
      if (request.readyState === 2) {
        console.log('getAllResponseHeaders');
        console.log(request.statusText);
        console.log(request.getAllResponseHeaders());
      }
      if (request.readyState === 3) {
        this.showResponse(request);
      }
      if (request.readyState === 4 && request.status === 200) {
        const type = request.getResponseHeader('Content-Type');
        console.log(type);
        console.log(request.statusText);
        this.showResponse(request);
      }
    }
    request.onprogress = function(e) {
      console.log(e);
    }
    request.onerror = function(err) {
      console.log('onerror');
      clearInterval(intervalTag);
    }
    request.onabort = function(err) {
      console.log('onabort');
      clearInterval(intervalTag);
    }
    request.ontimeout = function(err) {
      console.log('ontimeout');
      clearInterval(intervalTag);
    }
    request.onload = function(err) {
      console.log('onload');
      clearInterval(intervalTag);
    }
    request.send(null);
  }

  // 如何接受各种数据：application/json, application/xml, image/jpg
  getBinary(type) {
    const urlTypeMap = {
      xml: '/api/test/get/common?type=xml',
      image: '/api/test/get/common?type=image'
    }
    const url = urlTypeMap[type];
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.onreadystatechange = function() {
      if (request.readyState === 4 && request.status === 200) {
        const type = request.getResponseHeader('Content-Type');
        const responseText = request.responseText;
        const responseXML = request.responseXML;
        console.log(type);
        console.log(responseText);
        console.log(responseXML);
      }
    }
    request.send(null);
  }


  /**
   * 两种下载方式对比：
   * downloadByBlob，下载数据完成后，将数据转换成blob，通过a标签下载
   * downloadByTagA，直接打开下载弹框，使用浏览器自带的下载功能进行下载
   */
  downloadByBlob(url) {
    const query = this.parseQueryString(url.split('?').pop());
    const request = new XMLHttpRequest();
    request.responseType = 'blob';
    request.open('GET', url);
    request.onerror = function(err) {
      console.log('err');
      console.log(err);
    }
    request.onload = () => {
      const blob = new Blob([request.response]);
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = query.fileName ? query.fileName : '未命名';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
    }
    request.send(null);
  }
  downloadByTagA(url) {
    const query = this.parseQueryString(url.split('?').pop());
    const a = document.createElement('a');
    a.href = url;
    a.download = query.fileName ? query.fileName : '未命名';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
  }

  /**
   * 通过post发送数据
   */
  // setRequestHeader在open和send之间
  postCommon(url, data = {}) {
    const defaultData = {
      name: 'me',
      password: 'abcdef中文测试'
    }
    var contentType = this.parseQueryString(url)['content-type'];
    if (!contentType) {
      if (utils.node.isObject(data)) {
        contentType = 'application/json';
      } else if (data instanceof FormData) {
        contentType = 'multipart/form-data';
      }
    }
    const contentTypeList = ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'];
    if (!contentTypeList.includes(contentType)) {
      console.log(`contentType ${contentType} is not recognized!`);
      return;
    }
    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {
      if (request.readyState === 4 && request.status === 200) {
        const type = request.getResponseHeader('Content-Type');
        var body = request.responseText;
        console.log(`Content-Type: ${type}`);
        if (type.indexOf('application/json') > -1) {
          try {
            body = JSON.parse(body);
            if (url.startsWith('/api/test/echo') && body.hasOwnProperty('url') && body.hasOwnProperty('general') 
              && body.hasOwnProperty('headers') && body.hasOwnProperty('body')) {
              console.log(body.url);
              console.log(body.general);
              console.log(body.headers ? this.jsonFormat(body.headers) : '');
              console.log(body.body);
            } else {
              console.log(body);
            }
          } catch (err) {
            console.log(body);
          }
        } else {
          console.log(body);
        }
      }
    }
    request.open('POST', url);
    var payload = null;
    switch (contentType) {
      case 'application/json':
        data = Object.assign(defaultData, data);
        payload = JSON.stringify(data);
        request.setRequestHeader('Content-Type', contentType);
        break;
      case 'application/x-www-form-urlencoded':
        data = Object.assign(defaultData, data);
        const params = new URLSearchParams();
        for (let key in data) {
          params.append(key, data[key]);
        }
        payload = params.toString();
        request.setRequestHeader('Content-Type', contentType);
        break;
      case 'multipart/form-data':
        var formData = data;
        if ((data instanceof FormData)) {
        } else {
          formData = new FormData();
          data = Object.assign(defaultData, data);
          for (let key in data) {
            var value = data[key];
            if (value instanceof FileList) {
              [].slice.call(value).forEach(it => {
                formData.append(key, it);
              })
            } else {
              formData.append(key, value);
            }
          }
        }
        payload = formData;
        // no need to set Content-Type for multipart/form-data
        break;
    }
    request.send(payload);
  }

  // post(url, data) {
  //   const request = new XMLHttpRequest();
  //   request.onreadystatechange = function() {
  //     if (request.status === 0) {
  //       return;
  //     }
  //     const type = request.getResponseHeader('Content-Type');
  //     const body = request.response;
  //     console.log(body);
  //   }
  //   request.open('POST', url);
  //   request.send(data);
  // }

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

  jsonFormat(json, config) {
    /*
      change for npm modules.
      by Luiz Estácio.

      json-format v.1.1
      http://github.com/phoboslab/json-format

      Released under MIT license:
      http://www.opensource.org/licenses/mit-license.php
    */
    var p = [],
      indentConfig = {
        tab: { char: '\t', size: 1 },
        space: { char: ' ', size: 2 }
      },
      configDefault = {
        type: 'tab'
      },
      push = function( m ) { return '\\' + p.push( m ) + '\\'; },
      pop = function( m, i ) { return p[i-1] },
      tabs = function( count, indentType) { return new Array( count + 1 ).join( indentType ); };

    function JSONFormat ( json, indentType ) {
      p = [];
      var out = "",
          indent = 0;

      // Extract backslashes and strings
      json = json
        .replace( /\\./g, push )
        .replace( /(".*?"|'.*?')/g, push )
        .replace( /\s+/, '' );    

      // Indent and insert newlines
      for( var i = 0; i < json.length; i++ ) {
        var c = json.charAt(i);

        switch(c) {
          case '{':
          case '[':
            out += c + "\n" + tabs(++indent, indentType);
            break;
          case '}':
          case ']':
            out += "\n" + tabs(--indent, indentType) + c;
            break;
          case ',':
            out += ",\n" + tabs(indent, indentType);
            break;
          case ':':
            out += ": ";
            break;
          default:
            out += c;
            break;
        }
      }

      // Strip whitespace from numeric arrays and put backslashes
      // and strings back in
      out = out
        .replace( /\[[\d,\s]+?\]/g, function(m){ return m.replace(/\s/g,''); } )
        .replace( /\\(\d+)\\/g, pop ) // strings
        .replace( /\\(\d+)\\/g, pop ); // backslashes in strings

      return out;
    };

    config = config || configDefault;
    var indent = indentConfig[config.type];

    if ( indent == null ) {
      throw new Error('Unrecognized indent type: "' + config.type + '"');
    }
    var indentType = new Array((config.size || indent.size) + 1).join(indent.char);
    return JSONFormat(JSON.stringify(json), indentType);
  }
}
