var logger = require('../../logger').forModule('Elasticsearch Publisher');

module.exports = function setIncidentName(client, data) {
	logger.logInfo('Linking incident number to identifier', {
		voId: data.voId,
		incidentName: data.incidentName
	});

	var incidentUpdate = {
		voUuid: data.voId,
		incidentName: data.incidentName
	};

	client.upsert(data.voId, incidentUpdate)
		.then(() => {
			logger.logInfo('Incident number linked to identifier', {
				voId: data.voId,
				incidentName: data.incidentName
			});
		});
};
