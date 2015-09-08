var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');
var fixVictorOpsAlert = require('../fixVictorOpsAlert');
var request = require('request');
var elasticsearchVictorOpsAlert = new require('../elasticsearchVictorOpsAlert')();

var logger = require('../logger').forModule('Victorops webhook handler');
var eventEmitter = require('../events');

function setZendeskIdInElasticsearch(alert, zendeskId) {
	var request =  http.request({
		host: 'logs.laterooms.com',
		port: 9200,
		path: '/releases-' + moment().format('YYYY.MM') + '/victoropsAlert/' + alert.voUuid + '/_update',
		method: 'POST'
	}, function(response) { });

	request.write({
		"doc" : {
			"zendeskId": zendeskId
		}
	});
	request.end();

	logger.logInfo('Saving zendesk id to elasticsearch', { zendeskId: body.ticket.id });
}

function sendToZendesk(credentials, alert) {
	var currentHour = moment().hour();

	if(currentHour > 7 && currentHour < 18) {
		return logger.logInfo('Not creating incident in business hours for now.', { currentHour: currentHour });
	}

 	var encoded = new Buffer(credentials.apiUser + '/token:' + credentials.apiToken).toString('base64');

	request({
			url: 'https://' + credentials.subDomain + '.zendesk.com/api/v2/tickets.json',
			method: 'POST',
			body: {
				"ticket": {
					subject:  alert.message,
					comment:  { body: alert.message },
					custom_fields: [
						{ id: 27210271, value: "inc_bs_automated_alerting_victorops" }
					]
				}
			},
			json: true,
			headers: {
				'Authorization': 'Basic ' + encoded,
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		}, function(err, response, body) {
			if(response.statusCode !== 201) {
				return logger.logInfo('Could not save zendesk ticket', { responseStatusCode: response.statusCode });
			}

			logger.logInfo('Incident created in zendesk', { zendeskId: body.ticket.id });
			setZendeskIdInElasticsearch(alert, body.ticket.id);
		});
}

module.exports = function() {
	var configuredSendToZendesk;

	return {
		start: function(credentials) {
			configuredSendToZendesk = sendToZendesk.bind(undefined, credentials);
			logger.logInfo('VictorOps handler configured', { credentials: JSON.stringify(credentials) })
		},
		handle: function (teams, pipelineEvent) {
			var alert = pipelineEvent.message;

			logger.logInfo('VictorOps alert In.');
			logger.logInfo(alert);

			alert = fixVictorOpsAlert.cleanUpStrings(alert);
			alert = fixVictorOpsAlert.correctTypes(alert);
			alert = fixVictorOpsAlert.pruneProperties(alert);

			alert.team = teams.getTeamForAlert(alert);

			logger.logInfo('VictorOps Alert Corrected and team added');
			logger.logInfo(alert);

			elasticsearchVictorOpsAlert.setAlertDetailFromWebHook(alert).then(function() {
				logger.logInfo('Victorops alert stored to ES.');
			});
			configuredSendToZendesk(alert);

			logger.logInfo('Stored alert: ' + alert.voUuid);
		}
	};
};