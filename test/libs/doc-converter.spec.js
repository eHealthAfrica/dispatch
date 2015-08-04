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

	});

});