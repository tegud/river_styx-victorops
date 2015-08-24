var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');
var fixVictorOpsAlert = require('../fixVictorOpsAlert');

var logger = require('../logger').forModule('Victorops webhook handler');
var eventEmitter = require('../events');

module.exports = function() {
	return {
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

			var request =  http.request({
				host: 'logs.laterooms.com',
				port: 9200,
				path: '/releases-' + moment().format('YYYY.MM') + '/victoropsAlert/' + alert.voUuid,
				method: 'PUT'
			}, function(response) { });

			request.write(JSON.stringify(alert));
			request.end();

			console.log('Stored alert: ' + alert.voUuid);
		}
	};
};