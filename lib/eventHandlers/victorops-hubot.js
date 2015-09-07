var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');
var fixVictorOpsAlert = require('../fixVictorOpsAlert');
var request = require('request');
var elasticsearchVictorOpsAlert = require('../elasticsearchVictorOpsAlert');

var logger = require('../logger').forModule('Victorops Hubot webhook handler');
var eventEmitter = require('../events');

var handlers = {
	'PROBLEM': function(alert) {
		if(alert.DISPLAY_ALERT_TYPE === 'warning') {
			return logger.logInfo('Hubot problem alert is warning, ignoring.', { VO_UUID: alert.VO_UUID });
		}

		logger.logInfo('VO ID: ' + alert.VO_UUID + ', is Incident No.: ' + alert.INCIDENT_NAME);

		elasticsearchVictorOpsAlert.setIncidentNameFromHubot(alert.VO_UUID, alert.INCIDENT_NAME).then(function() {
			logger.logInfo('VO ID: ' + alert.VO_UUID + ', is Incident No.: ' + alert.INCIDENT_NAME + ', set in elasticsearch');
		});
	},
	'ACKNOWLEDGEMENT': function(alert) {
		logger.logInfo('Incident No.: ' + alert.INCIDENT_NAME + ' has been Ack\'ed by: ' + alert.NOTIFICATIONAUTHOR);
	},
	'RECOVERY': function(alert) {
		if(!alert.INCIDENT_NAME) { 
			return logger.logInfo('Recovery from non incident, ignoring.');
		}
		
		logger.logInfo('Incident No.: ' + alert.INCIDENT_NAME + ' has Recovered');
	}
};

function handle(message) {
	if(_.get(message, 'PAYLOAD.USER_STATUS_LIST')) {
		return logger.logInfo('User Status List, ignore');
	}

	var timelineList = _.get(message, 'PAYLOAD.TIMELINE_LIST');

	if(!timelineList || !timelineList.length) { 
		logger.logInfo('Unknown Structure for Victorops Hubot object');
		return logger.logInfo(JSON.stringify(message));
	}

	if(!timelineList[0].ALERT || !handlers[timelineList[0].ALERT.NOTIFICATIONTYPE]) {
		logger.logInfo('No handler for Victorops Hubot object');
		return logger.logInfo(JSON.stringify(message));
	}

	handlers[timelineList[0].ALERT.NOTIFICATIONTYPE](timelineList[0].ALERT);
}

module.exports = function() {
	return {
		handle: function (teams, pipelineEvent) {
			var victoropsMessage = pipelineEvent.message;

			handle(pipelineEvent.message);
		}
	};
};