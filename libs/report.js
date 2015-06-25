var q = require("q");
var storage = require("./storage.js");

this.generateMsg = function (alert) {
  var msg = '';
  var facilityName = alert.facility.name;
  var facilityWard = alert.facility.ward;
  var contactPhoneNo = alert.facility.contact.oldphone;

  switch (alert.db) {
    case storage.STOCK_OUT:
      msg = [
        'Stock out(',
        alert.productType.code,
        '):' ,
        facilityWard,
        ',',
        facilityName,
        ',',
        contactPhoneNo
      ].join(' ');
      break;
    case storage.CCU_BREAKDOWN:
      msg = [
        'CCU breakdown(',
        alert.dhis2_modelid,
        '):',
        facilityWard,
        ',',
        facilityName,
        ',',
        contactPhoneNo
      ].join(' ');
      break;
    default:
      msg = [
        'unknown alert type from ',
        facilityName
      ].join();
  }
  return msg;
};

//expose report as a module.
module.report = this;