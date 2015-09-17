var logger = require('../../logger').forModule('Elasticsearch Publisher');
var upsertAlert = require('./upsert');
var getDocumentIdFromIncidentName = require('./getDocumentIdFromIncidentName');

function updateAlertWithResolution(resolution, alertFromElasticsearch) {
	if(alertFromElasticsearch.resolved) {
		return logger.logInfo('Incident already resolved, dont update master record.', { incidentName: alertFromElasticsearch.incidentName, voId: alertFromElasticsearch.voUuid });
	}

	var resolvedAt = moment(resolution.timestamp);
	var alertedAt = moment(alertFromElasticsearch.voAlertReceivedTime);
	var alertResolution = {
		voUuid: alertFromElasticsearch.voUuid,
		resolved: true,
		resolvedAt: resolvedAt.format(),
		timeToResolution: resolvedAt.diff(alertedAt, 'ms')
	};

	return upsertAlert(alertFromElasticsearch.voUuid, alertResolution);
}

function resolveAlert(resolution) {
	return getDocumentIdFromIncidentName(resolution.incidentName)
		.then(updateAlertWithResolution.bind(undefined, resolution))
		.then(function() {
			logger.logInfo('Incident No.: ' + resolution.incidentName + ', resolved in elasticsearch');
		});
}

module.exports = resolveAlert;
