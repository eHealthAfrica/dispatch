'use strict';

var q = require("q");
var moment = require('moment');

var storage = require('./libs/storage.js');
var logger = require('./libs/logger.js');
var telerivet = require('./libs/telerivet.js');
var docConveter = require('./libs/doc-converter.js');

var startFromDate = process.env.START_FROM || new Date();


function getNextStartDate(date) {
	return moment(new Date(date).getTime()).subtract(1, 'day').toDate();
}

function writeToCouchDBS(groupDocs) {
	var promises = [];
	for (var key in groupDocs) {
		var docs = groupDocs[key];
		promises.push(storage.bulkUpdate(key, docs));
	}
	return q.all(promises);
}

function pullSMSFrom(date) {
	logger.info('Collating SMS since : ' + date);

	var since = (new Date(date).getTime() / 1000); //convert to UNIX timestamp

	var params = {
		time_created: {
			'min': since
		},
		direction: "incoming",
		message_type: "sms"
	};

	return telerivet.query(params)
			.then(function (collatedSMSList) {
				if (collatedSMSList && collatedSMSList.length === 0) {
					return q.reject('Message list is empty');
				}
				var dbNames = [storage.FACILITY, storage.PRODUCT_TYPES, storage.CCEI];
				return storage.loadDBS(dbNames)
						.then(function (res) {
							var facilityHash = docConveter.hashBy(res[0], '_id');
							var productTypeHash = docConveter.hashBy(res[1], '_id');
							var cceiHash = docConveter.hashBy(res[2], 'dhis2_modelid');

							var groupDocs = docConveter.smsToDocs(collatedSMSList, facilityHash, productTypeHash, cceiHash);

							return writeToCouchDBS(groupDocs);
						});
			});
}

function main(date) {
	pullSMSFrom(date)
			.then(function (res) {
				logger.info(res);
				var now = new Date();
				startFromDate = getNextStartDate(now);
			})
			.catch(function (err) {
				logger.error(err);
			})
			.finally(function () {
				var FIVE_MINS = 300000; //
				setInterval(function(){
					main(startFromDate);
				}, FIVE_MINS);
			});
}

main(startFromDate);






