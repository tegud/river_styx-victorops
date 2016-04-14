var logger = require('../../logger').forModule('Elasticsearch Publisher');

module.exports = function setZendeskId(client, data) {
	logger.logInfo('Setting Zendesk ID in elasticsearch', {
		voId: data.voId,
		zendeskId: data.zendeskId
	});

	var incidentUpdate = {
		zendeskId: data.zendeskId
	};

	client.upsert(data.voId, incidentUpdate)
		.then(() => logger.logInfo('Zendesk ID set in elasticsearch', {
			voId: data.voId,
			zendeskId: data.zendeskId
		}));
};
