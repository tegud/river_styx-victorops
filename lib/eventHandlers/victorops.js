var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');
var fixVictorOpsAlert = require('../fixVictorOpsAlert');
var request = require('request');

var logger = require('../logger').forModule('Victorops webhook handler');
var eventEmitter = require('../events');

function sendToElasticsearch(alert) {
	var request =  http.request({
		host: 'logs.laterooms.com',
		port: 9200,
		path: '/releases-' + moment().format('YYYY.MM') + '/victoropsAlert/' + alert.voUuid,
		method: 'PUT'
	}, function(response) { });
	request.write(JSON.stringify(alert));
	request.end();
}

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
}

function sendToZendesk(credentials, alert) {
 	var encoded = new Buffer(credentials.apiUser + '/token:' + credentials.apiToken).toString('base64');

	request({
			url: 'https://' + credentials.subDomain + '.zendesk.com/api/v2/tickets.json',
			method: 'POST',
			body: {
				"ticket": {
					subject:  alert.message
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
				console.log('Could not save zendesk ticket');
			}

			setZendeskIdInElasticsearch(alert, body.ticket.id);
		});
}

module.exports = function() {
	var configuredSendToZendesk;

	return {
		start: function(credentials) {
			configuredSendToZendesk = sendToZendesk.bind(undefined, credentials);
		},
		handle: function (teams, pipelineEvent) {
			var alert = pipelineEvent.message;

			console.log('VictorOps alert In.');
			console.log(alert);

			alert = fixVictorOpsAlert.cleanUpStrings(alert);
			alert = fixVictorOpsAlert.correctTypes(alert);
			alert = fixVictorOpsAlert.pruneProperties(alert);

			alert.team = teams.getTeamForAlert(alert);

			console.log('VictorOps Alert Corrected and team added');
			console.log(alert);

			sendToElasticsearch(alert);
			configuredSendToZendesk(alert);

			console.log('Stored alert: ' + alert.voUuid);
		}
	};
};