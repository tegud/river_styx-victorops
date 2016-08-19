var logger = require('../../logger').forModule('Elasticsearch Publisher');

module.exports = function setZendeskId(client, data) {
	logger.logInfo('Setting Zendesk ID in elasticsearch', data);

	var incidentUpdate = {
		zendeskId: data.zendeskId
	};

	client.upsert(data.alertId, incidentUpdate)
		.then(() => logger.logInfo('Zendesk ID set in elasticsearch', {
			voId: data.alertId,
			zendeskId: data.zendeskId
		}));
};
