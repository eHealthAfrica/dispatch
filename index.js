var http = require('http');
var request = require("request");

http.createServer(function (req, res) {

  res.writeHead(200, {'Content-Type': 'text/plain'});
  var body = '';
  if (req.method === 'POST') {
    req.on('data', function (data) {
      body += data;
    });
    req.on('end', function () {
      if (body.length > 0) {
        request({
          "uri": "http://dev.lomis.ehealth.org.ng:5984/offline_sms_alerts/",
          "json": JSON.parse(body),
          "method": "POST"
        });
      }
      res.end('reply to request: sms sent to server. \n');//reply sent to client/could be sms to be resen
    });

  } else {
    req.on('data', function (data) {
      body += data;
    });
    req.on('end', function () {
      res.end('request received successfully. \n');//this is the reply to the client
    });
  }

}).listen(4001, '127.0.0.1');
