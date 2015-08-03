var q = require("q");
var PouchDB = require('pouchdb');

var config = require('../config').config;

var BASE_URI = config.DB_URL;

this.FACILITY = "facilities";
this.PRODUCT_TYPES = "product_types";
this.STOCK_OUT = "stock_out";
this.CCU_BREAKDOWN = "ccu_breakdown";

this.CCEI = 'ccei';
this.OFFLINE_SMS_ALERTS = "offline_sms_alerts";
this.STOCK_COUNT = "stockcount";
this.OFFLINE_SMS_ALERTS = "offline_sms_alerts";

this.all = function (dbName) {
  var URI = BASE_URI + dbName;
  var db = new PouchDB(URI);
  return db.allDocs({include_docs: true})
      .then(function (res) {
        return res.rows
            .map(function (row) {
              return row.doc;
            });
      });
};


this.getRecord = function (dbName, uuid) {
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

this.loadDBS = function(dbNames) {
  var promises = [];
  var db;
  for(var i in dbNames){
    db = dbNames[i];
    promises.push(this.all(db));
  }
  return q.all(promises);
};

this.bulkUpdate = function(dbName, docs, opts){
  var params = opts | {};
  var URI = BASE_URI + dbName;
  var db = new PouchDB(URI);
  return db.bulkDocs(docs, params);
};


//expose storage as a module.
module.storage = this;