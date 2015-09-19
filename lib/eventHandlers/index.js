var http = require('http');
var logger = require('../logger').forModule('EventHandler');
var _ = require('lodash');

var Promise = require('bluebird');

var handlers = {
	'victorops': new require('./victorops')(),
	'zendesk-event': {
		handle: function(teams, event) {
			logger.logInfo('Zendesk Event', {event: JSON.stringify(event)});
		}
	},
	'victorops-hubot': new require('./victorops-hubot')()
};

module.exports = {
	start: function(credentials) {
		return new Promise(function(resolve) {
			logger.logInfo('Initialising Handlers...');

			_.each(handlers, function(handler) {
				if(handler.start) {
					handler.start(credentials);
				}
			});

			logger.logInfo('Handlers initialised.');
			resolve();
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
			logger.logInfo('Handler executed successfully.', { event: eventName });

			resolve();
		});
	}
}