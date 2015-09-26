var logger = require('../../logger').forModule('Elasticsearch Publisher');

function setIncidentName(client, data) {
	var incidentUpdate = {
		voUuid: data.voId, 
		incidentName: data.incidentName
	};

	client.upsert(data.voId, incidentUpdate)
		.then(function() {
			logger.logInfo('VO ID: ' + data.voId + ', is Incident No.: ' + data.incidentName + ', set in elasticsearch');
		});
}

module.exports = setIncidentName;
