var logger = require('../../logger').forModule('Elasticsearch Publisher');
var upsertAlert = require('./upsert');

function setZendeskId(data) {
	var incidentUpdate = {
		zendeskId: data.zendeskId,
	};

	upsertAlert(data.voId, incidentUpdate)
		.then(function() {
			logger.logInfo('Incident No.: ' + data.voId + ', ZendeskId: ' + data.zendeskId + ', set in elasticsearch');
		});
}

module.exports = setZendeskId;
