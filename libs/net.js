const fs = require('fs');

class Net {
  defaultResponse(response) {
    response.writeHead(200, {
      'Content-Type': 'html'
    });
    fs.createReadStream('./net.html').pipe(response);
  }

}