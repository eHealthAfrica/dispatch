'use strict';

var q = require("q");
var telerivet = require('telerivet');

var config = require('../config').config;
var docConverter = require("./doc-converter.js");

var defaultConfig = {
	apiKey: config.sms.API_KEY,
	projectID: config.sms.PROJECT_ID
};

function parseSMSJSON(collateSMS){
	var result = [];
	var doc;
	for(var id in collateSMS){
		if(collateSMS.hasOwnProperty(id)){
			doc = collateSMS[id];
			result.push(doc);
		}
	}
	return result;
}

this.query = function(params, cfg){
	var dfd = q.defer();
	var apiConfig = cfg || defaultConfig;

	var tr = new telerivet.API(apiConfig.apiKey);
	var project = tr.initProjectById(apiConfig.projectID);
	var cursor = project.queryMessages(params);

	var counter = 0;
	var collateSMS = {};

	cursor.count(function (err, count) {
		if (err) {
			dfd.reject(err);
		}
		cursor.each(function (err, message) {
			if (err) {
				dfd.reject(err);
			}

			if(message && message.content){
				var content = message.content;
				if (content && docConverter.isValid(content)) {
					var msgJson = JSON.parse(content);
					if (msgJson && (msgJson.uuid  || msgJson._id) && msgJson.db ){
						var smsId = (msgJson.uuid  || msgJson._id);
						//init new sms
						if (!collateSMS[smsId]) {
							collateSMS[smsId] = { db: msgJson.db };
						}
						for (var k in msgJson) {
							collateSMS[smsId][k] =  msgJson[k];
						}
					}
				}
			}
			counter += 1;
			if(counter === count){
				var result = parseSMSJSON(collateSMS);
				dfd.resolve(result);
			}
		});
	});
	return dfd.promise;
};


module.telerivet  = this;