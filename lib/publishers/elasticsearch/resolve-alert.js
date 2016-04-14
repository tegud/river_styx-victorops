var moment = require('moment');
var logger = require('../../logger').forModule('Elasticsearch Publisher');

module.exports = function updateAlertWithResolution(client, resolution, alertFromElasticsearch) {
	if(alertFromElasticsearch.resolved) {
		return logger.logInfo('Incident already resolved, dont update master record', { incidentName: alertFromElasticsearch.incidentName, voId: alertFromElasticsearch.voUuid });
	}

	var resolvedAt = moment(resolution.timestamp);
	var alertedAt = moment(alertFromElasticsearch.voAlertReceivedTime);
	var alertResolution = {
		voUuid: alertFromElasticsearch.voUuid,
		resolved: true,
		resolvedAt: resolvedAt.utc().format(),
		timeToResolution: resolvedAt.diff(alertedAt, 'ms')
	};

	return client.upsert(alertFromElasticsearch.voUuid, alertResolution);
}

function resolveAlert(client, resolution) {
	return client.getDocumentIdFromIncidentName(resolution.incidentName)
		.then(alert => updateAlertWithResolution(client, resolution, alert))
		.then(() => logger.logInfo('Incident resolved in elasticsearch', {
			incidentName: resolution.incidentName
		}));
};
