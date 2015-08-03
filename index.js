var q = require("q");

var storage = require('./libs/storage.js');
var logger = require('./libs/logger.js');
var telerivet = require('./libs/telerivet.js');
var docConveter = require('./libs/doc-converter.js');

var date = process.env.START_FROM || new Date();


function pullSMSFrom(date) {
	logger.log('Collating SMS since : ' + date);

	var params = {
		time_created: {
			'min': new Date(date).getTime() / 1000 //convert to UNIX timestamp
		},
		direction: "incoming",
		message_type: "sms"
	};

	return telerivet.query(params)
			.then(function (collatedSMSList) {
				var dbNames = [storage.FACILITY, storage.PRODUCT_TYPES, storage.CCEI];
				return storage.loadDBS(dbNames)
						.then(function (res) {
							var facilityHash = docConveter.hashBy(res[0], '_id');
							var productTypeHash = docConveter.hashBy(res[1], '_id');
							var cceiHash = docConveter.hashBy(res[2], 'dhis2_modelid');

							var groupDocs = docConveter.smsToDocs(collatedSMSList, facilityHash, productTypeHash, cceiHash);

							var promises = [];
							for (var key in groupDocs) {
								var docs = groupDocs[key];
								promises.push(storage.bulkUpdate(key, docs));
							}

							//return q.all(promises);
						});
			});
}

function main(date){
	pullSMSFrom(date)
			.then(function(res){
				logger.log(res);
			})
			.catch(function(err){
				logger.error(err);
			})
			.finally(function(){
				main(date);
			});
}

main(date);






