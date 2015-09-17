var logger = require('../../logger').forModule('Elasticsearch Publisher');
var upsertAlert = require('./upsert');

function setIncidentName(data) {
	var incidentUpdate = {
		voUuid: data.voId, 
		incidentName: data.incidentName
	};

	upsertAlert(data.voId, incidentUpdate)
		.then(function() {
			logger.logInfo('VO ID: ' + data.voId + ', is Incident No.: ' + data.incidentName + ', set in elasticsearch');
		});
}

module.exports = setIncidentName;
