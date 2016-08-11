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
			var client = new Client(config.elasticsearch);

			logger.logInfo('Starting elasticsearch publisher', { 'handlers': Object.keys(handlerMap).join(', ') });

			return new Promise(resolve => {
				Object.keys(handlerMap).forEach(key => {
					logger.logInfo('Attaching Elasticsearch Victorops handler', { 'event': key, 'handler': handlerMap[key] });

					events.on(key, require(`./${handlerMap[key]}`).bind(undefined, client));
				});

				logger.logInfo('Elasticsearch publisher started');
				resolve();
			});
		}
	};
}
