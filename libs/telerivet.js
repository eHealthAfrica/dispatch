'use strict';

var q = require("q");
var telerivet = require('telerivet');

var config = require('../config').config;
var docConverter = require("./doc-converter.js");
var storage = require("./storage.js");

var teleWrapper = {};

var defaultConfig = {
	apiKey: config.sms.API_KEY,
	projectID: config.sms.PROJECT_ID
};


teleWrapper.query = function (params, cfg) {
	var dfd = q.defer();
	var apiConfig = cfg || defaultConfig;

	var tr = new telerivet.API(apiConfig.apiKey);
	var project = tr.initProjectById(apiConfig.projectID);
	var cursor = project.queryMessages(params);

	var counter = 0;
	var collateSMS = {};
	var result = [];
	cursor.count(function (err, count) {
		if (err) {
			dfd.reject(err);
		}
		if (count === 0) {
			dfd.resolve(result);
		}
		cursor.each(function (err, message) {
			if (err) {
				dfd.reject(err);
			}
			collateSMS = docConverter.parseSMSContent(collateSMS, message);

			counter += 1;
			if (counter === count) {
				result = docConverter.parseSMSJSON(collateSMS);
				dfd.resolve(result);
			}
		});
	});
	return dfd.promise;
};

teleWrapper.pullSMSFrom = function (date) {
	var since = (new Date(date).getTime() / 1000); //convert to UNIX timestamp

	var params = {
		time_created: {
			'min': since
		},
		direction: "incoming",
		message_type: "sms"
	};

	return teleWrapper.query(params)
			.then(function (collatedSMSList) {
				if (collatedSMSList && collatedSMSList.length === 0) {
					return q.reject('Message list is empty');
				}
				var dbNames = [storage.FACILITY, storage.PRODUCT_TYPES, storage.CCEI];
				return storage.loadDBS(dbNames)
						.then(function (res) {
							var facilityHash = docConverter.hashBy(res[0], '_id');
							var productTypeHash = docConverter.hashBy(res[1], '_id');
							var cceiHash = docConverter.hashBy(res[2], 'dhis2_modelid');

							var groupDocs = docConverter.smsToDocs(collatedSMSList, facilityHash, productTypeHash, cceiHash);

							return storage.writeToCouchDBS(groupDocs);
						});
			});
};

module.exports = teleWrapper;