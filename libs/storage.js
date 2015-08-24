var q = require("q");
var PouchDB = require('pouchdb');

var config = require('../config').config;

var BASE_URI = config.DB_URL;
var storage = {};

storage.FACILITY = "facilities";
storage.PRODUCT_TYPES = "product_types";
storage.STOCK_OUT = "stock_out";
storage.CCU_BREAKDOWN = "ccu_breakdown";
storage.CCEI = 'ccei';
storage.OFFLINE_SMS_ALERTS = "offline_sms_alerts";
storage.STOCK_COUNT = "stockcount";



storage.all = function (dbName) {
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

storage.loadDBS = function(dbNames) {
  var promises = [];
  var db;
  for(var i in dbNames){
    db = dbNames[i];
    promises.push(storage.all(db));
  }
  return q.all(promises);
};

storage.bulkUpdate = function(dbName, docs, opts){
  var params = opts || {};
  var URI = BASE_URI + dbName;
  var db = new PouchDB(URI);
  return db.bulkDocs(docs, params);
};

storage.writeToCouchDBS = function(groupDocs) {
  var promises = [];
  for (var key in groupDocs) {
    var docs = groupDocs[key];
    if(groupDocs.hasOwnProperty(key)){
      promises.push(storage.bulkUpdate(key, docs));
    }
  }
  return q.all(promises);
};


//expose storage as a module.
module.exports = storage;