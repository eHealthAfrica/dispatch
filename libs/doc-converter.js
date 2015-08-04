'use strict';

var _ = require('underscore');
var storage = require("./storage.js");

var docConverter = {};

function addTo(list, doc) {
	if (doc) {
		list.push(doc);
	}
	return list;
}

docConverter.toStockOut = function (smsDoc, facility, productType) {
	smsDoc._id = smsDoc.uuid;
	smsDoc.facility = facility;
	smsDoc.productType = productType;
	return smsDoc;
};

docConverter.toCCUBreakdown = function (smsDoc, facility, cceProfile) {
	smsDoc._id = smsDoc.uuid;
	smsDoc.facility = facility;
	smsDoc.ccuProfile = cceProfile;
	return smsDoc;
};

docConverter.smsToDocs = function (smsDocs, facilityHash, productTypeHash, cceiHash) {
	var groupDocs = {};
	var smsDoc;
	for (var i in smsDocs) {
		smsDoc = smsDocs[i];
		if (smsDoc && docConverter.isComplete(smsDoc)) {
			var doc;
			var facility = facilityHash[smsDoc.facility];
			if (!groupDocs[smsDoc.db]) {
				groupDocs[smsDoc.db] = [];
			}
			if (smsDoc.db === storage.STOCK_OUT) {
				var productType = productTypeHash[smsDoc.productType];
				doc = docConverter.toStockOut(smsDoc, facility, productType);

			} else if (smsDoc.db === storage.CCU_BREAKDOWN) {
				var ccuProfile = cceiHash[smsDoc.dhis2_modelid];
				doc = docConverter.toCCUBreakdown(smsDoc, facility, ccuProfile);
			}else if(smsDoc.db === storage.STOCK_COUNT){
				doc = smsDoc;
			}
			groupDocs[smsDoc.db] = addTo(groupDocs[smsDoc.db], doc);
		}
	}
	return groupDocs;
};

docConverter.isValid = function (msg) {
	var NOT_FOUND = -1;
	return _.isString(msg) && msg.indexOf('{') !== NOT_FOUND && msg.indexOf('}') !== NOT_FOUND;
};

docConverter.isComplete = function (doc) {
	if (!_.isString(doc.db) || !_.isString(doc.uuid) || _.isUndefined(doc.facility) || _.isUndefined(doc.created)) {
		return false;
	}
	switch (doc.db) {
		case storage.STOCK_OUT:
			return (!_.isUndefined(doc.productType) && !_.isUndefined(doc.stockLevel));
		case storage.CCU_BREAKDOWN:
			/*jshint camelcase: false */
			return !_.isUndefined(doc.dhis2_modelid);
		case storage.STOCK_COUNT:
			return _.isObject(doc.unopened) && Object.keys(doc.unopened).length > 0;
		default:
			return false;
	}
};

docConverter.hashBy = function (docs, key) {
	var hashMap = {};
	var doc;
	for (var i in docs) {
		doc = docs[i];
		if (doc && doc[key]) {
			var id = doc[key];
			hashMap[id] = doc;
		}
	}
	return hashMap;
};

docConverter.parseSMSJSON = function (collateSMS) {
	var result = [];
	var doc;
	for (var id in collateSMS) {
		if (collateSMS.hasOwnProperty(id)) {
			doc = collateSMS[id];
			result.push(doc);
		}
	}
	return result;
};

function collateStockCount(smsId, msgJSON, collatedSMS){
	var stockCount = collatedSMS[smsId];
  if(stockCount && stockCount.db === storage.STOCK_COUNT){
	  stockCount.uuid = smsId;
	  stockCount._id = stockCount.uuid;
	  stockCount.isComplete = 1;

	  if(msgJSON.hasOwnProperty('ppId')){
		  var unopened = stockCount.unopened || {};
		  unopened[msgJSON.ppId] = msgJSON.qty;
		  stockCount.unopened = unopened;
	  }
	  if(msgJSON.hasOwnProperty('cd')){
		  stockCount.countDate = msgJSON.cd;
	  }
	  if(msgJSON.hasOwnProperty('created')){
		  stockCount.created = msgJSON.created;
		  stockCount.modified = msgJSON.created;//assume to be same could be wrong.
	  }
	  if(msgJSON.hasOwnProperty('facility')){
		  stockCount.facility = msgJSON.facility;
	  }
	  if(msgJSON.hasOwnProperty('ppLen')){
		  stockCount.ppLength = msgJSON.ppLen;
	  }
	  collatedSMS[smsId] = stockCount;
  }
	return collatedSMS;
}

docConverter.parseSMSContent = function(collateSMS, message) {
	if (message && message.content) {
		var content = message.content;
		if (content && docConverter.isValid(content)) {
			var msgJson = JSON.parse(content);
			if (msgJson && (msgJson.uuid || msgJson._id) && msgJson.db) {
				var smsId = (msgJson.uuid || msgJson._id);
				//init new sms
				if (!collateSMS[smsId]) {
					collateSMS[smsId] = { db: msgJson.db };
				}

				if(msgJson.db === storage.STOCK_COUNT){
					collateSMS = collateStockCount(smsId, msgJson, collateSMS);
				}else{
					//collate others stock out, cce breakdown etc
					for (var k in msgJson) {
						collateSMS[smsId][k] = msgJson[k];
					}
				}
			}
		}
	}
	return collateSMS;
};

//expose messenger as a module.
module.exports = docConverter;