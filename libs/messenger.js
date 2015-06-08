var request = require('request');
var nodeMailer = require("nodemailer");
var config = require('konfig')();
var q = require("q");
var _ = require('underscore');

var storage = require("./storage.js");
var report = require("./report.js");


var mailerSettings = config.app.email;
var smsSettings = config.app.sms;

var sendSms = function(recipient, msg, options){
  var deferred = q.defer();
  var SMS_URI = smsSettings.SMS_URI;
  var PHONE_ID = smsSettings.PHONE_ID;
  var API_KEY = smsSettings.API_KEY;
  var smsOpts = {
    "phone_id": PHONE_ID,
    "to_number": recipient,
    "content": msg,
    "api_key": API_KEY
  };
  var opts = {
    method: "POST",
    json: smsOpts,
    uri: SMS_URI
  };

  var settings = options || opts;

  request(settings, function (err, res, body) {
    if (res) {
      deferred.resolve(res.body);
    } else {
      deferred.reject(err);
    }
  });
  return deferred.promise;
};

var sendEmail = function(recipient, sender, msg, subject, opts){
  var deferred = q.defer();
  var settings = opts || mailerSettings;
  var smtpTransport = nodeMailer.createTransport("SMTP", settings);
  var mailInfo = {
    from: sender,
    to: recipient,
    subject: subject,
    text: msg
  };
  smtpTransport.sendMail(mailInfo, function (err, res) {
    if (!err) {
      deferred.resolve(res);
    } else {
      deferred.reject(err);
    }
  });
  return deferred.promise;
};

var getCompleteObject = function(alert){
  var deferred = q.defer();
  var promises = [];
  promises.push(storage.getRecord(storage.FACILITY, alert.facility));
  switch(alert.db){
    case 'stock_out':
      promises.push(storage.getRecord(storage.PRODUCT_TYPES, alert.productType));
      q.all(promises)
        .then(function(res){
          var facility = res[0];
          var productType = res[1];
          //TODO: load product type uom, type objects. to form more informative msg.
          alert.facility = facility;
          alert.productType = productType;
          deferred.resolve(alert);
        })
        .catch(function(err){
          deferred.reject(err);
        });
      break;
    case 'ccu_breakdown':
      q.all(promises)
        .then(function(res){
          var facility = res[0];
          alert.facility = facility;
          deferred.resolve(alert);
        })
        .catch(function(err){
          deferred.reject(err);
        });
      break;
    default:
      deferred.reject('unknown alert database.');
  }
  return deferred.promise;
};

this.processAlert = function(alert, subject){

  var deferred = q.defer();
  var facilityUuid = alert.facility;
  var promises = [];
  promises.push(storage.getRecord(storage.CONTACTS, facilityUuid));
  promises.push(getCompleteObject(alert));

  q.all(promises)
      .then(function(res){
        var facilityContactInfo = res[0];
        var completeAlertObj = res[1];
        var msg = report.generateMsg(completeAlertObj);

        //send emails in background.
        for(var i in facilityContactInfo.emails){
          var email = facilityContactInfo.emails[i];
          var sender = mailerSettings.auth.user;
          sendEmail(email, sender, msg, subject); //send in background
        }

        //send sms in background
        var phoneNos = facilityContactInfo.phone;
        for(var index in phoneNos){
          var recipient = phoneNos[index];
          sendSms(recipient, msg);
        }

        deferred.resolve(true);//that alert has been processed.
      })
      .catch(function(err){
        deferred.reject(err);
      });

  return deferred.promise;
};

this.isValid = function(msg) {
  var NOT_FOUND = -1;
  return _.isString(msg) && msg.indexOf('{') !== NOT_FOUND && msg.indexOf('}') !== NOT_FOUND;
};

this.isComplete = function (alert) {
  if (!_.isString(alert.db) || !_.isString(alert.uuid) || _.isUndefined(alert.facility) || _.isUndefined(alert.created)) {
    return false;
  }
  switch (alert.db) {
    case storage.STOCK_OUT:
      return (!_.isUndefined(alert.productType) && !_.isUndefined(alert.stockLevel));
    case storage.CCU_BREAKDOWN:
      /*jshint camelcase: false */
      return !_.isUndefined(alert.dhis2_modelid);
    default:
      throw 'unknown database type:' + alert.db;
  }
};

//expose messenger as a module.
module.messenger = this;