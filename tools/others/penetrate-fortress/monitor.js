const path = require('path');
const Monitor = require('forever-monitor');

const script = path.resolve(__dirname, 'penetrate-fortress.js');

var monitor = new Monitor(script, {
  silent: true,
  env: {
    PORT: 8000
  }
});
monitor.start();