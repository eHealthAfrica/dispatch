'use strict';

var pkg = require('../package.json');
var log4js = require('log4js');

var logCategory = pkg.name;
var logFile = 'logs/' + logCategory + '.log';

log4js.configure({
  appenders: [
    {
      type: 'console'
    },
    {
      type: 'file',
      filename: logFile,
      category: logCategory,
      maxLogSize: 20480,
      backups: 3
    }
  ]
});

module.exports = log4js.getLogger(logCategory);