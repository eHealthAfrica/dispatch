var chai = require('chai');
var spies = require('chai-spies');

chai.use(spies);
var assert = chai.assert;
var expect = chai.expect;

var config = require('../../config').config;
var storage = require('../../libs/storage.js');
var request;

describe('storage', function () {

	beforeEach(function () {
		request = chai.spy(require('request'));
	});

	it('Should be defined', function () {
		assert.isDefined(storage);
	});

	describe('getRecord', function () {
		it('Should return a promise', function (done) {
			storage.getRecord('testDB', 'uuid')
					.finally(function () {
						done();
					});
		});
	});

});