'use strict';

require('v8-profiler');
var q = require("q");
var moment = require('moment');
var heapdump = require('heapdump');
var memwatch = require('memwatch');
var storage = require('./libs/storage.js');
var logger = require('./libs/logger.js');
var telerivet = require('./libs/telerivet.js');


var startFromDate = process.env.START_FROM || new Date();
var isProcessing = false;
var FIVE_MINS = 300000;


function memDump() {
	var file = ['/tmp/dispatch-', process.pid, new Date().toString(), '.heapsnapshot'].join('-');
	heapdump.writeSnapshot(file, function (err) {
		if (err) {
			logger.error(err);
		} else {
			logger.info('Wrote snapshot: ' + file);
		}
	});
}

memwatch.on('leak', function (info) {
	logger.error(info);
	memDump();
});

function main() {
	if (isProcessing) {
		return q.when('still processing');
	}
	logger.info('Memory consumption : ', process.memoryUsage());
	isProcessing = true;
	var date = startFromDate || moment().subtract(1, 'day').toDate();
	telerivet.pullSMSFrom(new Date(date))
			.then(function (res) {
				logger.info(res);
			})
			.catch(function (err) {
				logger.error(err);
			})
			.finally(function () {
				startFromDate = null;
				isProcessing = false;
				logger.info('Memory consumption : ', process.memoryUsage());
				global.gc();
				logger.info('After GC Memory consumption : ', process.memoryUsage());
			});
}

function init() {
	logger.info('Memory consumption : ', process.memoryUsage());
	setInterval(main, FIVE_MINS);
}

init();

