var chai = require('chai');

var assert = chai.assert;
var	expect = chai.expect;
var should = chai.should(); // Note that should has to be executed
var _ = require('underscore');

var docConverter = require('../../libs/doc-converter.js');

describe('docConverter', function() {
	it('Should be defined', function() {
		assert.isDefined(docConverter);
	});

  describe('isValid', function(){
		it('Should return TRUE if string contains { and } ', function(){
			var msg = '{}';
			var result = docConverter.isValid(msg);
			expect(result).to.equal(true);
		});

	  it('Should return FALSE if string does not contain { ', function(){
		  var msg = '}';
		  var result = docConverter.isValid(msg);
		  expect(result).to.equal(false);
	  });

	  it('Should return FALSE if string does not contain } ', function(){
			var msg = '{';
		  var result = docConverter.isValid(msg);
		  expect(result).to.equal(false);
	  });

	  it('Should return FALSE if string does not contain { and } ', function(){
		  var msg = 'hello world';
		  var result = docConverter.isValid(msg);
		  expect(result).to.equal(false);
	  });

  });

	describe('isComplete', function(){
		it('Should return False if doc.db is unknown', function(){
			var doc = {
				db: 'NOT_EXPECTED_DB',
				uuid: '123456',
				facility: 'Test Facility',
				created: new Date().toJSON()
			};

			var isComplete = docConverter.isComplete(doc);
			expect(isComplete).to.equal(false);
		});

		it('Should return FALSE if doc.db is not a String', function(){

			var doc = {
				db: null,
				uuid: '123456',
				facility: 'Test Facility',
				created: new Date().toJSON()
			};

			expect(_.isString(doc.db)).to.equal(false);
			var result = docConverter.isComplete(doc);
			expect(result).to.equal(false);
		});

		it('Should return FALSE if doc.uuid id not a String', function(){
			var doc = {
				db: 'ccu_breakdown',
				uuid: null,
				facility: 'Test Facility',
				created: new Date().toJSON()
			};

			expect(_.isString(doc.uuid)).to.equal(false);
			var result = docConverter.isComplete(doc);
			expect(result).to.equal(false);
		});

		it('Should return FALSE if doc.facility is UNDEFINED', function(){
			var doc = {
				db: null,
				uuid: '123456',
				created: new Date().toJSON()
			};

			expect(_.isUndefined(doc.facility)).to.equal(true);
			var result = docConverter.isComplete(doc);
			expect(result).to.equal(false);
		});

		it('Should return FALSE if doc.created is UNDEFINED', function(){
			var doc = {
				db: null,
				uuid: '123456',
				facility: 'Test Facility'
			};

			expect(_.isUndefined(doc.created)).to.equal(true);
			var result = docConverter.isComplete(doc);
			expect(result).to.equal(false);
		});

		it('Should return TRUE if doc.db is stock_out and doc.stockLevel and doc.productType are defined', function(){
			var doc = {
				db: 'stock_out',
				uuid: '1234567890-1926177',
				facility: 'Test Facility',
				created: new Date().toJSON(),
				stockLevel: 30,
				productType: 'BCG'
			};

			var result = docConverter.isComplete(doc);
			expect(result).to.equal(true);
		});

		it('Should return FALSE if doc.db is stock_out, doc.stockLevel is not defined', function(){
			var doc = {
				db: 'stock_out',
				uuid: '1234567890-1926177',
				facility: 'Test Facility',
				created: new Date().toJSON(),
				productType: 'BCG'
			};

			var result = docConverter.isComplete(doc);
			expect(result).to.equal(false);
		});


		it('Should return FALSE if doc.db is stock_out, doc.productType is not defined', function(){
			var doc = {
				db: 'stock_out',
				uuid: '1234567890-1926177',
				facility: 'Test Facility',
				created: new Date().toJSON(),
				productType: 'BCG'
			};

			var result = docConverter.isComplete(doc);
			expect(result).to.equal(false);
		});

		it('Should return FALSE if doc.db is "stockcount" and doc.unopened is not defined', function(){
			var doc = {
				db: 'stockcount',
				uuid: '37a0e46e-efe8-44bc-f525-af373d4b3122',
				_id: '37a0e46e-efe8-44bc-f525-af373d4b3122',
				isComplete: 1,
				countDate: '2015-07-29T23:00:00.000Z',
				facility: 'FACILITY_ID',
				created: '2015-08-03T13:01:49.276Z',
				modified: '2015-08-03T13:01:49.276Z'
			};

			var result = docConverter.isComplete(doc);
			expect(result).to.equal(false);
		});

		it('Should return TRUE if doc.db is "stockcount" and doc.unopened is defined', function(){
			var doc = {
				db: 'stockcount',
				uuid: '37a0e46e-efe8-44bc-f525-af373d4b3122',
				_id: '37a0e46e-efe8-44bc-f525-af373d4b3122',
				isComplete: 1,
				countDate: '2015-07-29T23:00:00.000Z',
				facility: 'FACILITY_ID',
				unopened: {
					'V1': 200,
					'V2': 0,
					'V3': 200,
					'V4': 100,
					'V5': 200,
					'v6': 100
				},
				created: '2015-08-03T13:01:49.276Z',
				modified: '2015-08-03T13:01:49.276Z'
			};

			var result = docConverter.isComplete(doc);
			expect(result).to.equal(true);
		});

	});

	describe('hashBy', function() {

		it('Should hash an Array into key value map by given property', function(){
			var list = [ { _id: '1234' }, { _id: '1234' }, { _id: '3245' } ];
			var hashMap = docConverter.hashBy(list, '_id');
			var value = hashMap['1234'];
			assert.isDefined(value);

			var value2 = hashMap['3245'];
			assert.isDefined(value2);
		});

	});


	describe('addTo', function(){

		it('Should NOT add UNDEFINED elements to list', function() {
			var emptyList = [];
			emptyList = docConverter.addTo(emptyList);
			expect(emptyList.length).to.equal(0);
		});

		it('Should add DEFINED elements', function() {
			var emptyList = [];
			var elem1 = { db: 'test', _id: '123-XX-YY-ZZ' };
			var elem2 = { db: 'test2', _id: '562-XX-YY-ZZ' };

			emptyList = docConverter.addTo(emptyList, elem1);
			emptyList = docConverter.addTo(emptyList, elem2);

			expect(emptyList.length).to.equal(2);
		});

	});

	describe('toStockOut', function () {

		it('Should set _id property', function(){
			var doc = {
				db: 'stock_out',
				uuid: '1234567890-1926177',
				facility: 'Test Facility',
				created: new Date().toJSON(),
				productType: 'BCG'
			};
			var facility = { name: 'Test HP', _id: '123-KKL' };
			var productType = { name: 'BCG', _id: '321-kLS-a32' };
			assert.isUndefined(doc._id);
			var result = docConverter.toStockOut(doc, facility, productType);
			assert.isDefined(result._id);
		});

		it('Should set facility uuid with passed in facility object', function() {
			var doc = {
				db: 'stock_out',
				uuid: '1234567890-1926177',
				facility: 'Test Facility',
				created: new Date().toJSON(),
				productType: 'BCG'
			};
			var facility = { name: 'Test HP', _id: '123-KKL' };
			var productType = { name: 'BCG', _id: '321-kLS-a32' };
			var isStringBefore = _.isString(doc.facility);
			expect(isStringBefore).to.equal(true);
			var result = docConverter.toStockOut(doc, facility, productType);
			var isObjectAfter = _.isObject(result.facility);
			expect(isObjectAfter).to.equal(true);
			expect(result.facility).to.equal(facility);
		});

		it('Should set product type uuid with passed in product type object', function() {
			var doc = {
				db: 'stock_out',
				uuid: '1234567890-1926177',
				facility: 'Test Facility',
				created: new Date().toJSON(),
				productType: 'BCG'
			};
			var facility = { name: 'Test HP', _id: '123-KKL' };
			var productType = { name: 'BCG', _id: '321-kLS-a32' };
			var isStringBefore = _.isString(doc.productType);
			expect(isStringBefore).to.equal(true);
			var result = docConverter.toStockOut(doc, facility, productType);
			var isObjectAfter = _.isObject(result.productType);
			expect(isObjectAfter).to.equal(true);
			expect(result.productType).to.equal(productType);
		});

	});

});