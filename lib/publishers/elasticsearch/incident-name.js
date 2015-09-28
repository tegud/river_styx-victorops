var logger = require('../../logger').forModule('Elasticsearch Publisher');

function setIncidentName(client, data) {
	logger.logInfo('Linking VO ID: ' + data.voId + ' to Incident No.: ' + data.incidentName + ' in elasticsearch');
	
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
