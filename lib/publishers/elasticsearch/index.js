var Promise = require('bluebird');

var logger = require('../../logger').forModule('Elasticsearch Publisher');
var events = require('../../events');
var Client = require('./client');

var handlerMap = {
	'victorops-incident-name': 'incident-name',
	'victorops-acknowledgement': 'acknowledgement',
	'victorops-recovery': 'resolve-alert',
	'victorops-alert': 'alert',
	'victorops-zendeskId': 'set-zendesk-id'
};

module.exports = function ElasticsearchVictorOpsAlert() {
	return {
		start: function(config) {
			var client = new Client();

			return new Promise(function(resolve) {
				Object.keys(handlerMap).forEach(function(key) {
					logger.logInfo('Attaching Elasticsearch Victorops handler', { 'event': key, 'handler': handlerMap[key] });
					
					events.on(key, require('./' + handlerMap[key]).bind(undefined, client));
				});

				resolve();
			});
		}
	};
}
