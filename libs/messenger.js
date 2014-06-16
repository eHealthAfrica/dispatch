var request = require('request');
var nodeMailer = require("nodemailer");
var q = require("q");
var storage = require("./storage.js");
var report = require("./report.js");

var mailerSettings = {
  service: "Gmail",
  auth: {
    user: "norepy.lomis@gmail.com",
    pass: "LoMIS123"
  }
};

var sendSms = function(recipient, msg, options){
  var deferred = q.defer();
  var SMS_URI = "https://api.telerivet.com/v1/projects/PJf8a8a65975f7f1b6/messages/outgoing";
  var PHONE_ID = "PN74ab386d6c2c6c85";
  var API_KEY = "3TaBSKoPGytuLebcgAXdVll5vjUlcuwd";//TODO: DO NOT EXPOSE IN SOURCE CODE.
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
      //promises.push(getRecordFromRemoteDb(CCU_PROFILE, alert.dhis2_modelid));//TODO: change dhis2_modelid to uuid in  lomis code, this will
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
        for(var index in facilityContactInfo.emails){
          var email = facilityContactInfo.emails[index];
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

//expose messenger as a module.
module.messenger = this;