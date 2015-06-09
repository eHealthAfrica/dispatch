var chai = require('chai');

var assert = chai.assert;

var logger = require('../../libs/logger.js');

describe('logger', function () {

	it('Should be defined', function () {
		assert.isDefined(logger);
	});

});