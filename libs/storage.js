var q = require("q");
var request = require('request');

var config = require('konfig')();

var BASE_URI =  config.app.DB_URL;

this.FACILITY = "facilities";
this.PRODUCT_TYPES = "product_types";
this.CONTACTS = "contacts";
this.STOCK_OUT = "stock_out";
this.CCU_BREAKDOWN = "ccu_breakdown";
this.OFFLINE_SMS_ALERTS = "offline_sms_alerts";

this.getRecord = function(dbName, uuid){
  var deferred = q.defer();
  var URI = BASE_URI + dbName + "/" + uuid;
  var opts = {
    "uri": URI,
    "method": "GET"
  };
  request(opts, function (err, res, body) {
    if (res) {
      deferred.resolve(JSON.parse(res.body));
    } else {
      deferred.reject(err);
    }
  });
  return deferred.promise;
};

this.createOrUpdate = function(dbName, record){
  var deferred  = q.defer();
  var URI = BASE_URI + dbName + "/";

  if (typeof record._id === 'undefined') {
    record._id = record.uuid;
  }

  var requestSettings = {
    "uri": URI + record._id,
    "method": "GET"
  };

  //try to get remote copy of doc.
  request(requestSettings, function (err, res, body) {

    //prepare request settings for PUT request.
    requestSettings.method = "POST";
    requestSettings.json = record;
    requestSettings.uri = URI;

    if (res) {
      var couchResponse = JSON.parse(res.body);
      if (!couchResponse.error) {
        //update couchResponse document with record properties
        var recordProperties = Object.keys(record);
        for (var index in recordProperties) {
          var key = recordProperties[index];
          couchResponse[key] = record[key];
        }

        //set updated couchResponse as json doc to post to server.
        requestSettings.json = couchResponse;

        //POST updated copy
        request(requestSettings, function (err, res, body) {
          if(!err){
            deferred.resolve(couchResponse);
          }else{
            deferred.reject(err);
          }
        });

      } else {
        if (couchResponse.error === 'not_found' && couchResponse.reason === 'missing') {
          //save record as a new doc.
          request(requestSettings, function (err, res, body) {
            if (!err) {
              record._id = res.body.id;
              record._rev = res.body.rev;
              deferred.resolve(record);
            } else {
              deferred.reject(err);
            }
          });
        }else{
          deferred.reject(couchResponse);
        }
      }
    }
  });
  return deferred.promise;
};

//expose storage as a module.
module.storage = this;