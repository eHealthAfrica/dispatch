var http = require('http');
var querystring = require('querystring');
var request = require('request');
var q = require("q");
var storage = require("./libs/storage.js");
var messenger = require('./libs/messenger.js');


var isValid = function (msg) {
  var NOT_FOUND = -1;
  return msg.indexOf('{') !== NOT_FOUND && msg.indexOf('}') !== NOT_FOUND;
};


var isComplete = function (alert) {
  if (typeof alert.db === 'undefined' || typeof alert.uuid === 'undefined' || typeof alert.facility === 'undefined' || typeof alert.created === 'undefined') {
    return false;
  }

  switch (alert.db) {
    case storage.STOCK_OUT:
      return (typeof alert.productType !== 'undefined' && typeof alert.stockLevel !== 'undefined');
    case storage.CCU_BREAKDOWN:
      /*jshint camelcase: false */
      return (typeof alert.dhis2_modelid !== 'undefined');
    default:
      throw 'unknown database type:' + alert.db;
  }
};

var receiveAlert = function (alert) {
  var deferred = q.defer();
  storage.createOrUpdate(storage.OFFLINE_SMS_ALERTS, alert)
      .then(function (res) {
        if (isComplete(res)) {
          var emailSubject = "LoMIS alert";
          //send email and sms in background
          messenger.processAlert(alert, emailSubject);

          //push alert to alert db.
          storage.createOrUpdate(alert.db, alert);

        } else {
          console.log("alert is incomplete.");
        }
        deferred.resolve(res);
      })
      .catch(function (err) {
        deferred.reject(err);
      });
  return deferred.promise;
};

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
      if (isValid(requestMsgBody)) {
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
              console.log(res);
            })
            .catch(function (err) {
              console.log(err);
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

}).listen(4001, '127.0.0.1');
