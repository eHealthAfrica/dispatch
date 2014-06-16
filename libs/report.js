var q = require("q");
var storage = require("./storage.js");

this.generateMsg = function(alert){
  var msg = '';
  var facilityName = [alert.facility.name, 'HF'].join(' ');
  switch (alert.db) {
    case storage.STOCK_OUT:
      msg = [
        'There is low',
        alert.productType.code,
        ' product type at' ,
        facilityName,
        ', current level:',
        alert.stockLevel
      ].join(' ');
      break;
    case storage.CCU_BREAKDOWN:
      msg = [
        'There is ccu model:',
        alert.dhis2_modelid,
        'breakdown at ',
        facilityName
      ].join(' ');
      break;
    default:
      msg = ['unknown alert type from ',
        facilityName
      ].join();
  }
  return msg;
};

//expose report as a module.
module.report = this;