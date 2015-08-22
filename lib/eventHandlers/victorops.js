var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');
var fixVictorOpsAlert = require('fixVictorOpsAlert');

var logger = require('../logger').forModule('Victorops webhook handler');
var eventEmitter = require('../events');

module.exports = function() {
	return {
		handle: function (teams, pipelineEvent) {
			var alert = pipelineEvent.message;

			console.log('VictorOps alert In.');
			console.log(alert);

			var team = teams.getTeamForAlert(alert);

			alert = fixVictorOpsAlert.cleanUpStrings(alert);
			alert = fixVictorOpsAlert.correctTypes(alert);

			alert.team = team;

			console.log('VictorOps Alert Corrected and team added');
			console.log(alert);
		}
	};
};