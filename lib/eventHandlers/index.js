const http = require('http');
const logger = require('../logger').forModule('EventHandler');
const _ = require('lodash');

const handlers = {
	'victoropsv2-incident': new require('./victorops')(),
	'zendesk-event': {
		handle: (teams, event) => {
			logger.logInfo('Zendesk Event', { event: JSON.stringify(event)} );
		}
	}
};

module.exports = {
	start: function(credentials) {
		logger.logInfo('Initialising Handlers...');

		return Object.keys(handlers)
			.reduce((startHandlers, handler) => {
				if(!handlers[handler].start) {
					return startHandlers;
				}

				startHandlers.push(handlers[handler].start);

				return startHandlers;
			}, [])
			.map(handler => handler(credentials));
	},
	handle: function(eventName, ...handleArguments) {
		return new Promise(function (resolve, reject) {
			if(!handlers[eventName] || !handlers[eventName].handle) {
				logger.logInfo(`Unknown type: ${eventName} encountered.`);
				return;
			}

			handlers[eventName].handle.apply(undefined, handleArguments);

			resolve();
		});
	}
}
