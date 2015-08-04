var chai = require('chai');
var spies = require('chai-spies');

chai.use(spies);
var assert = chai.assert;
var expect = chai.expect;

var storage = require('../../libs/storage.js');

describe('storage', function () {


	it('Should be defined', function () {
		assert.isDefined(storage);
	});

	describe('all', function () {
		it('Should return a promise', function (done) {
			storage.all('testDB', 'uuid')
					.finally(function () {
						done();
					});
		});
	});

});