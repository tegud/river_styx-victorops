var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');
var logger = require('./logger');

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

	function upsertAlert(alert) {
		return new Promise(function(resolve, reject) {
			var request =  http.request({
				host: 'logs.laterooms.com',
				port: 9200,
				path: '/releases-' + moment().format('YYYY.MM') + '/victoropsAlert/' + alert.voUuid + '/_update?retry_on_conflict=3',
				method: 'POST'
			}, function(response) {
				var allData = '';

				response.on('data', function (chunk) {
					allData += chunk;
				});

				response.on('end', function () {
					logger.logInfo(JSON.parse(JSON.stringify(allData, null, 4)));
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

			promises.push(upsertAlert({
				acknowledged: true,
				acknowledgedBy: acknowledgement.acknowledgedBy,
				acknowledgedAt: acknowledgedAt.format(),
				timeToAcknowledgement: alertedAt.diff(acknowledgedAt, 'ms')
			}));
		}

		return Promise.all(promises);
	}

	function updateAlertWithResolution(resolution, alertFromElasticsearch) {
		if(alertFromElasticsearch.resolved) {
			return logger.logInfo('Incident already resolved, dont update master record.', { incidentName: alertFromElasticsearch.incidentName, voId: alertFromElasticsearch.voUuid });
		}

		var resolvedAt = moment(resolution.timestamp);
		var alertedAt = moment(alertFromElasticsearch.voAlertReceivedTime);

		return upsertAlert({
			resolved: true,
			resolvedAt: resolvedAt.format(),
			timeToResolution: alertedAt.diff(resolvedAt, 'ms')
		});
	}

	function acknowledgeAlert(acknowledgement) {
		return getDocumentIdFromIncidentName(acknowledgement.incidentName).then(updateAlertWithAcknowledgement.bind(undefined, acknowledgement));
	}

	function resolveAlert(resolution) {
		return getDocumentIdFromIncidentName(resolution.incidentName).then(updateAlertWithResolution.bind(undefined, acknowledgement));
	}

	return {
		setAlertDetailFromWebHook: function(alert) {
			return upsertAlert(alert);
		},
		setIncidentNameFromHubot: function(voId, incidentName) {
			return upsertAlert({
				voUuid: voId, 
				incidentName: incidentName
			});
		},
		acknowledge: acknowledgeAlert,
		resolve: resolveAlert
	};
}
