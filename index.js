var http = require('http');
var request = require("request");

http.createServer(function (req, res) {

  if (req.method === 'POST') {
    var body = '';
    req.on('data', function (data) {
      body += data;
    });
    req.on('end', function () {
      request({
        "uri": "http://dev.lomis.ehealth.org.ng:5984/offline_sms_alerts/",
        "json": JSON.parse(body),
        "method": "POST"
      });
      res.end('reply to request: sms sent to server. \n');//this is the reply to the request.
    });

  }

}).listen(8000, 'lomis.ehealth.org.ng');
