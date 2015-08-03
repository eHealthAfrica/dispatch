'use strict';

var _ = require('underscore');
var storage = require("./storage.js");


function addTo(list, doc){
	if(doc){
		list.push(doc);
	}
	return list;
}

this.toStockOut = function(smsDoc, facility, productType) {
	smsDoc._id = smsDoc.uuid;
	smsDoc.facility = facility;
	smsDoc.productType = productType;
	return smsDoc;
};

this.toCCUBreakdown = function(smsDoc, facility, cceProfile) {
	smsDoc._id = smsDoc.uuid;
	smsDoc.facility = facility;
	smsDoc.ccuProfile = cceProfile;
	return smsDoc;
};

this.smsToDocs = function (smsDocs, facilityHash, productTypeHash, cceiHash){
	var groupDocs = {};
	var smsDoc;
	for (var i in smsDocs) {
		smsDoc = smsDocs[i];
		if (smsDoc && this.isComplete(smsDoc)) {
			var doc;
			var facility = facilityHash[smsDoc.facility];
			if(!groupDocs[smsDoc.db]){
				groupDocs[smsDoc.db] = [];
			}
			if (smsDoc.db === storage.STOCK_OUT) {
				var productType = productTypeHash[smsDoc.productType];
				doc = this.toStockOut(smsDoc, facility, productType);

			}else if(smsDoc.db === storage.CCU_BREAKDOWN){
				var ccuProfile = cceiHash[smsDoc.dhis2_modelid];
				doc = this.toCCUBreakdown(smsDoc, facility, ccuProfile);
			}
			groupDocs[smsDoc.db] = addTo(groupDocs[smsDoc.db], doc);
		}
	}
	return groupDocs;
};

this.isValid = function(msg) {
	var NOT_FOUND = -1;
	return _.isString(msg) && msg.indexOf('{') !== NOT_FOUND && msg.indexOf('}') !== NOT_FOUND;
};

this.isComplete = function (doc) {
	if (!_.isString(doc.db) || !_.isString(doc.uuid) || _.isUndefined(doc.facility) || _.isUndefined(doc.created)) {
		return false;
	}
	switch (doc.db) {
		case storage.STOCK_OUT:
			return (!_.isUndefined(doc.productType) && !_.isUndefined(doc.stockLevel));
		case storage.CCU_BREAKDOWN:
			/*jshint camelcase: false */
			return !_.isUndefined(doc.dhis2_modelid);
		default:
			 return false;
	}
};

this.hashBy = function(docs, key){
	var hashMap = {};
	var doc;
	for(var i in docs){
		doc = docs[i];
		if(doc && doc[key]){
			var id = doc[key];
			hashMap[id] = doc;
		}
	}
	return hashMap;
};

//expose messenger as a module.
module.docConverter = this;