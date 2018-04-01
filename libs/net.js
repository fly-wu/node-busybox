const fs = require('fs');
const path = require('path');

class Net {
  defaultResponse(response) {
    response.writeHead(200, {
      'Content-Type': 'html'
    });
    fs.createReadStream(path.resolve(__dirname, 'net.html')).pipe(response);
  }
}

module.exports = new Net();