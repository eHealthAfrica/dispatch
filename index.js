var http = require('http');
var querystring = require('querystring');
var request = require('request');

var createOrUpdate = function (obj) {

  var URI = "http://dev.lomis.ehealth.org.ng:5984/offline_sms_alerts/";

  if (typeof obj._id === 'undefined')
    obj._id = obj.uuid;

  var requestSettings = {
    "uri": URI + obj._id,
    "method": "GET"
  };

  //try to get remote copy of doc.
  request(requestSettings, function (err, res, body) {

    //prepare request settings for PUT request.
    requestSettings.method = "POST";
    requestSettings.json = obj;
    requestSettings.uri = URI;

    if (res) {
      var couchResponse = JSON.parse(res.body);
      if (!couchResponse.error) {

        //update couchResponse document with obj properties
        var objProperties = Object.keys(obj);
        for (var index in objProperties) {
          var key = objProperties[index];
          couchResponse[key] = obj[key];
        }

        //set updated couchResponse as json doc to post to server.
        requestSettings.json = couchResponse;

        //POST updated copy
        request(requestSettings, function (err, res, body) {
          console.log(res.body);
        });

      } else {
        console.log(couchResponse);

        if (couchResponse.error === 'not_found' && couchResponse.reason === 'missing') {
          //save obj as a new doc.
          request(requestSettings, function (err, res, body) {
            console.log(res.body);
          });
        }
      }
    }

  });

}

http.createServer(function (req, res) {

  var requestMsgBody = '';
  if (req.method === 'POST') {
    res.writeHead(200, {'Content-Type': 'text/plain'});

    //aggregate post body
    req.on('data', function (data) {
      requestMsgBody += data;
    });

    //process complete request
    req.on('end', function () {
      if (requestMsgBody.length > 0) {
        //parse POST message body to json
        var decodedMsg = querystring.parse(requestMsgBody);
        var obj = JSON.parse(decodedMsg.content);
        createOrUpdate(obj);
      }
      res.end('reply to request: sms sent to server. \n');//reply sent to client/could be sms to be resen
    });

  } else {
    res.writeHead(405, {});
    req.on('data', function (data) {
      requestMsgBody += data;
    });
    req.on('end', function () {
      res.end();
    });
  }

}).listen(4001, '127.0.0.1');
