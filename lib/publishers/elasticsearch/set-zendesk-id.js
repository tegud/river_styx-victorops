var logger = require('../../logger').forModule('Elasticsearch Publisher');

function setZendeskId(client, data) {
	var incidentUpdate = {
		zendeskId: data.zendeskId,
	};

	client.upsert(data.voId, incidentUpdate)
		.then(function() {
			logger.logInfo('Incident No.: ' + data.voId + ', ZendeskId: ' + data.zendeskId + ', set in elasticsearch');
		});
}

module.exports = setZendeskId;
