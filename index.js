var http = require('http');
var querystring = require('querystring');
var request = require('request');

http.createServer(function (req, res) {

  res.writeHead(200, {'Content-Type': 'text/plain'});
  var requestMsgBody = '';
  if (req.method === 'POST') {
    req.on('data', function (data) {
      requestMsgBody += data;
    });
    req.on('end', function () {
      if (requestMsgBody.length > 0) {
        //parse POST message body to json
        var decodedMsg = querystring.parse(requestMsgBody);

        request({
          "uri": "http://dev.lomis.ehealth.org.ng:5984/offline_sms_alerts/",
          "json": decodedMsg,
          "method": "POST"
        });
      }
      res.end('reply to request: sms sent to server. \n');//reply sent to client/could be sms to be resen
    });

  } else {
    req.on('data', function (data) {
      requestMsgBody += data;
    });
    req.on('end', function () {
      res.end('request received, send POST request to send sms to server. \n');//this is the reply to the client
    });
  }

}).listen(4001, '127.0.0.1');
