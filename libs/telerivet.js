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
		if(count === 0){
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

module.exports = teleWrapper;