var http = require('http');
var querystring = require('querystring');
var q = require("q");

var storage = require("./libs/storage.js");
var messenger = require('./libs/messenger.js');
var logger = require('./libs/logger.js');

var PORT = 4001;
var SERVER = '127.0.0.1';


var receiveAlert = function (alert) {
  var deferred = q.defer();
  storage.createOrUpdate(storage.OFFLINE_SMS_ALERTS, alert)
      .then(function (res) {
        if (messenger.isComplete(res)) {
          var emailSubject = "LoMIS alert";
          //send email and sms in background
          messenger.processAlert(alert, emailSubject);

          //push alert to alert db.
          storage.createOrUpdate(alert.db, alert);

        } else {
          logger.warn("alert is incomplete.");
        }
        deferred.resolve(res);
      })
      .catch(function (err) {
        deferred.reject(err);
      });
  return deferred.promise;
};

logger.info('Server started: '+ SERVER + ' , Port No: ' + PORT);

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
      if (messenger.isValid(requestMsgBody)) {
        //parse POST message body to json
        var decodedMsg = querystring.parse(requestMsgBody);
        var alert = JSON.parse(decodedMsg.content);
        if(typeof alert.db !== "undefined"){
          if(alert.db ==='stockCount'){
            if(typeof alert.ppId === "undefined" || typeof alert.uuid === "undefined"){
              console.log("incomplete stock count message received");
            }else{
              storage.createOrUpdate(alert.db, alert);
            }
          }
        }
        receiveAlert(alert)
            .then(function (res) {
              logger.info(res);
            })
            .catch(function (err) {
              logger.error(err);
            });
      }
      res.end('reply to request: sms sent to server. \n');//reply sent to client.
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

}).listen(PORT, SERVER);
