var http = require('http');
var logger = require('../logger').forModule('EventHandler');
var _ = require('lodash');

var Promise = require('bluebird');

var handlers = {
	'victorops': new require('./victorops')(),
	'zendesk-event': {
		handle: function(teams, event) {
			logger.logInfo('Zendesk event', JSON.stringify(event));
		}
	}
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
				logger.logInfo('No event handler for type, ignoring', {event: eventName});
				return;
			}

			logger.logInfo('Handler found, executing.', { event: eventName });
			handlers[eventName].handle.apply(undefined, handleArguments);

			resolve();
		});
	}
}