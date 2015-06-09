'use strict';

var path = require('path');

var env = process.env.NODE_ENV || 'test';
var paths = {
	env: path.join(__dirname, env)
};

paths.config = path.join(paths.env, 'app.json');
var config = require(paths.config);

module.exports = {
	config: config
};