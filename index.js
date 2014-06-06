var http = require('http');
var querystring = require('querystring');
var request = require('request');

var createOrUpdate = function(obj) {
  if(typeof obj._id === 'undefined')
    obj._id = obj.uuid;
  
  var requestSettings = {
    "uri": "http://dev.lomis.ehealth.org.ng:5984/offline_sms_alerts/",
    "json": obj
    "method": "POST"
  };
  //try to post
  request(requestSettings, function(err, res, body) {
    //if couch returns 409 conflict & rev
    if(res === 409)
    {
      //take uuid and revision and create PUT
      requestSettings.method = "PUT";
      requestSettings.json._rev = body._rev;
      request(requestSettings, function(err, res, body) {
        if(err !== null)
          console.log(err);
        //console.log(res);
        console.log(body);
      });
    }

    if(err !== null)
      console.log(err);
    //console.log(res);
    console.log(body);
  });
  
  request(requestSettings, function(err, res, body) {
      if(err !== null)
        console.log(err);
      //console.log(res);
      console.log(body);
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
      console.log();
      if (requestMsgBody.length > 0) {
        //parse POST message body to json
        var decodedMsg = querystring.parse(requestMsgBody);
        console.log(decodedMsg.content);
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
