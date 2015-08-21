'use strict';

var q = require("q");
var moment = require('moment');
var heapdump = require('heapdump');
var memwatch = require('memwatch');
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
	console.info('Collating SMS since : ' + date);

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

function main(date, delay) {
	var isProcessing = false;
	var counter = 0;
	var nxtSF;

	setInterval(function () {
		if (isProcessing) {
			return q.when('Currently processing!');
		}
		isProcessing = true;
		nxtSF = date;
		if (counter > 0) {
			nxtSF = getNextStartDate(new Date());
		}
		pullSMSFrom(nxtSF)
				.finally(function () {
					counter++;
					isProcessing = false;
					logger.info('Memory consumption : ', process.memoryUsage());
					var file = '/tmp/myapp-' + process.pid + '-' + Date.now() + '.heapsnapshot';
					heapdump.writeSnapshot(file, function (err) {
						if (err) {
							logger.error(err);
						} else {
							logger.error('Wrote snapshot: ' + file);
						}
					});
				});
	}, delay);
}


memwatch.on('leak', function (info) {
	logger.error(info);
	var file = '/tmp/dispatch-' + process.pid + '-' + Date.now() + '.heapsnapshot';
	heapdump.writeSnapshot(file, function (err) {
		if (err) {
			logger.error(err);
		} else {
			logger.error('Wrote snapshot: ' + file);
		}
	});
});

var FIVE_MINS = 300000;

logger.info('Memory consumption : ', process.memoryUsage());
main(startFromDate, FIVE_MINS);






