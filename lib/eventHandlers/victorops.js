var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');
var fixVictorOpsAlert = require('../fixVictorOpsAlert');
var request = require('request');

var logger = require('../logger').forModule('Victorops webhook handler');
var eventEmitter = require('../events');

module.exports = function() {
	var configuredSendToZendesk;

	return {
		start: function(credentials) {
			logger.logInfo('VictorOps handler configured', { credentials: JSON.stringify(credentials) })
		},
		handle: function (teams, pipelineEvent) {
			var alert = pipelineEvent.message;

			logger.logInfo('VictorOps alert In.', { VOID: alert.vo_uuid });
			logger.logInfo(JSON.stringify(alert, null, 4));

			alert = fixVictorOpsAlert.cleanUpStrings(alert);
			alert = fixVictorOpsAlert.correctTypes(alert);
			alert = fixVictorOpsAlert.pruneProperties(alert);

			alert.team = teams.getTeamForAlert(alert);

			logger.logInfo('VictorOps Alert Corrected and team added');
			logger.logInfo(JSON.stringify(alert, null, 4));

			eventEmitter.emit('victorops-alert', alert);

			logger.logInfo('Stored alert: ' + alert.voUuid);
		}
	};
};