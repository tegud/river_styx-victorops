var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');
var logger = require('../logger');
var events = require('../events');

function buildIncidentNameSearch(incidentName) {
	return {
		"query":{
			"filtered":{
				"filter":{
					"bool":{
						"must":[
							{
								"range":{
									"@timestamp":{
										"from":"now-12h"
									}
								}
							},
							{
								"term": {
									"_type": "victoropsAlert"
								}
							},
							{
								"term": {
									"incidentName": incidentName
								}
							}
						]
					}
				}
			}
		},
		"size":1
	};
}

module.exports = function ElasticsearchVictorOpsAlert() {
	function getDocumentIdFromIncidentName(incidentName) {
		return new Promise(function(resolve, reject) {
			var request =  http.request({
				host: 'logs.laterooms.com',
				port: 9200,
				path: '/releases-' + moment().format('YYYY.MM') + '/_search',
				method: 'POST'
			}, function(response) {
				var allData = '';

				response.on('data', function (chunk) {
					allData += chunk;
				});

				response.on('end', function () {
					var parsedData = JSON.parse(allData);

					var hits = _.get(parsedData, 'hits.hits');

					if(!hits || !hits.length) {
						reject('Could not retrieve elasticsearch reference');
						return logger.logInfo('Failed retrieving full incident record from ES', { incidentName: incidentName, esResponse: allData });
					}

					logger.logInfo('VO ID Found for incident name', { incidentName: incidentName, voId: hits[0]['_source'].voUuid });

					resolve(hits[0]['_source']);
				});
			});

			request.write(JSON.stringify(buildIncidentNameSearch(incidentName)));

			request.end();
		});
	}

	function upsertAlert(id, alert) {
		return new Promise(function(resolve, reject) {
			logger.logInfo('Upserting elasticsearch alert record', { id: id, alert: JSON.stringify(alert, null, 4) });

			var request =  http.request({
				host: 'logs.laterooms.com',
				port: 9200,
				path: '/releases-' + moment().format('YYYY.MM') + '/victoropsAlert/' + id + '/_update?retry_on_conflict=3',
				method: 'POST'
			}, function(response) {
				var allData = '';

				response.on('data', function (chunk) {
					allData += chunk;
				});

				response.on('end', function () {
					logger.logInfo('Elasticsearch alert upsert complete', { esResponse: JSON.parse(JSON.stringify(allData, null, 4))});
					resolve();
				});
			});

			request.write(JSON.stringify({
				"doc": alert,
				"upsert" : alert
			}));

			request.end();
		});
	}

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

	function acknowledgeAlert(acknowledgement) {
		return getDocumentIdFromIncidentName(acknowledgement.incidentName)
			.then(updateAlertWithAcknowledgement.bind(undefined, acknowledgement))
			.then(function() {
				logger.logInfo('Incident No.: ' + acknowledgement.incidentName + ', acknowledged in elasticsearch');
			});
	}

	function resolveAlert(resolution) {
		return getDocumentIdFromIncidentName(resolution.incidentName)
			.then(updateAlertWithResolution.bind(undefined, resolution))
			.then(function() {
				logger.logInfo('Incident No.: ' + resolution.incidentName + ', resolved in elasticsearch');
			});
	}

	function setAlert(alert) {
		upsertAlert(data.voUuid, data)
			.then(function() {
				logger.logInfo('Victorops zendeskId stored to ES.', { victorOpsId: id, zendeskid: body.ticket.id });
			});
	}

	function setIncidentName(data) {
		var incidentUpdate = {
			voUuid: data.voId, 
			incidentName: data.incidentName
		};

		upsertAlert(data.voId, incidentUpdate)
			.then(function() {
				logger.logInfo('VO ID: ' + alert.voId + ', is Incident No.: ' + alert.incidentName + ', set in elasticsearch');
			});
	}

	function setZendeskId(data) {
		var incidentUpdate = {
			zendeskId: data.zendeskId,
		};

		upsertAlert(data.voId, incidentUpdate)
			.then(function() {
				logger.logInfo('Incident No.: ' + data.voId + ', ZendeskId: ' + data.zendeskId + ', set in elasticsearch');
			});
	}

	return {
		setZendeskId: function(id, zendeskId) {
			return upsertAlert(id, {
				zendeskId: zendeskId
			});
		},
		start: function(config) {
			events.on('victorops-incident-name', setIncidentName);
			events.on('victorops-acknowledgement', acknowledgeAlert);
			events.on('victorops-recovery', resolveAlert);
			events.on('victorops-alert', setAlert);
			events.on('victorops-zendeskId', setZendeskId);
		}
	};
}
