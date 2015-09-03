var http = require('http');
var logger = require('../logger');
var _ = require('lodash');

var Promise = require('bluebird');

var handlers = {
	'victorops': new require('./victorops')()
};

module.exports = {
	start: function(credentials) {
		logger.logInfo('Initialising Handlers...');
		_.each(handlers, function(handler) {
			if(handler.start) {
				handler.start(credentials);
			}
		});
	},
	handle: function(eventName) {
		var handleArguments = Array.prototype.slice.call(arguments, 1);
		return new Promise(function (resolve, reject) {
			if(!handlers[eventName] || !handlers[eventName].handle) {
				return;
			}

			handlers[eventName].handle.apply(undefined, handleArguments);

			resolve();
		});
	}
}