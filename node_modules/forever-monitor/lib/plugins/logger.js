/*
 * logger.js: Plugin for `Monitor` instances which adds stdout and stderr logging.
 *
 * (C) 2010 Charlie Robbins & the Contributors
 * MIT LICENCE
 *
 */

var fs = require('fs');
const path = require('path');
const Transform = require('stream').Transform;

const utils = {
  isString(s) {
    return typeof(s) === 'string' || s instanceof String;
  },
  isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  },
  isDate(n) {
    return n instanceof Date;
  },

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
}

// child.stdout -> Formatter -> monitor.stdout
class Formatter extends Transform {
  constructor(dataSource, options) {
    super(options);
    var colors = {
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      gray: [90, 39],
      grey: [90, 39],
    };
    this.colors = {};
    Object.keys(colors).forEach(it => {
      var val = colors[it];
      this.colors[it] = {
        open: '\u001b[' + val[0] + 'm',
        close: '\u001b[' + val[1] + 'm',
      }
    });
  }
  _transform(chunk, enc, next) {
    chunk = chunk.toString();
    var formatted = chunk.split('\n').map(line => {
      if (line) {
        return `${this.colors.green.open}${utils.formatDate(Date.now(), 'hh:mm:ss')}${this.colors.green.close} ${line}`;
      } else {
        return line;
      }
    }).join('\n');
    next(null, formatted);
  }
}

//
// ### function attach (options)
// #### @options {Object} Options for attaching to `Monitor`
// Attaches functionality for logging stdout and stderr to `Monitor` instances.
exports.attach = function (options) {

  var monitor = this;
  options = options || {};

  monitor.on('start', startLogs);
  monitor.on('restart', startLogs);
  monitor.on('exit', stopLogs);

  var outFormatter = new Formatter();
  var errFormatter = new Formatter();
  function stopLogs() {
    if (monitor.child.stdout && options.outFile) {
      // Remark: 0.8.x doesnt have an unpipe method
      monitor.child.stdout.unpipe && monitor.child.stdout.unpipe(outFormatter);
    }
    // Remark: 0.8.x doesnt have an unpipe method
    if (monitor.child.stderr && options.errFile) {
      monitor.child.stderr.unpipe && monitor.child.stderr.unpipe(errFormatter);
    }
  }

  function startLogs(child, childData) {
    if (monitor.child) {
      monitor.child.stdout.on('data', function onStdout(data) {
        monitor.emit('stdout', data);
      });
      monitor.child.stderr.on('data', function onStderr(data) {
        monitor.emit('stderr', data);
      });

      if (!options.silent) {
        process.stdout.setMaxListeners(0);
        process.stderr.setMaxListeners(0);
        monitor.child.stdout.pipe(process.stdout, { end: false });
        monitor.child.stderr.pipe(process.stderr, { end: false });
      }

      if (options.outFile) {
        monitor.child.stdout.pipe(outFormatter);
        outFormatter.on('data', buf => {
          var logPath = path.resolve(`${options.outFile}-${utils.formatDate(Date.now(), 'yyyy-MM-dd')}`);
          fs.existsSync(logPath) ?
            fs.appendFile(logPath, buf.toString(), function() {}) :
            fs.writeFileSync(logPath, buf.toString());
        });
      }
      if (options.errFile) {
        monitor.child.stdout.pipe(errFormatter);
        errFormatter.on('data', buf => {
          var logPath = path.resolve(`${options.errFile}-${utils.formatDate(Date.now(), 'yyyy-MM-dd')}`);
          fs.existsSync(logPath) ?
            fs.appendFile(logPath, buf.toString(), function() {}) :
            fs.writeFileSync(logPath, buf.toString());
        });
      }
    }
  }
};


