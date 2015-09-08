var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');
var logger = require('./logger');

module.exports = function ElasticsearchVictorOpsAlert() {
	function getDocumentIdFromIncidentName(incidentName) {
		return new Promise(function(resolve, reject) {
			resolve();
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

	function acknowledgeAlert(acknowledgement) {
		return new Promise(function(resolve, reject) {

		});
	}

	function resolveAlert(acknowledgement) {
		return new Promise(function(resolve, reject) {

		});
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
		acknowledge: function(acknowledgement) {
			getDocumentIdFromIncidentName(acknowledgement).then(acknowledgeAlert);
		},
		resolve: function(resolution) {
			getDocumentIdFromIncidentName(resolution).then(resolveAlert);
		}
	};
}
