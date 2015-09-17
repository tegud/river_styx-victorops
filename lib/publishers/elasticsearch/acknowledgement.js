var logger = require('../../logger').forModule('Elasticsearch Publisher');
var upsertAlert = require('./upsert');
var getDocumentIdFromIncidentName = require('./getDocumentIdFromIncidentName');

function updateAlertWithAcknowledgement(acknowledgement, alertFromElasticsearch) {
	var promises = [];

	if(alertFromElasticsearch.acknowledged) {
		logger.logInfo('Incident already acknowledged, dont update master record.', { incidentName: alertFromElasticsearch.incidentName, voId: alertFromElasticsearch.voUuid });
	}
	else {
		var acknowledgedAt = moment(acknowledgement.timestamp);
		var alertedAt = moment(alertFromElasticsearch.voAlertReceivedTime);
		var alertAcknowledgement = {
			acknowledged: true,
			acknowledgedBy: acknowledgement.acknowledgedBy,
			acknowledgedAt: acknowledgedAt.format(),
			timeToAcknowledgement: acknowledgedAt.diff(alertedAt, 'ms')
		};

		promises.push(upsertAlert(alertFromElasticsearch.voUuid, alertAcknowledgement));
	}

	return Promise.all(promises);
}

function acknowledgeAlert(acknowledgement) {
	return getDocumentIdFromIncidentName(acknowledgement.incidentName)
		.then(updateAlertWithAcknowledgement.bind(undefined, acknowledgement))
		.then(function() {
			logger.logInfo('Incident No.: ' + acknowledgement.incidentName + ', acknowledged in elasticsearch');
		});
}

module.exports = acknowledgeAlert;
