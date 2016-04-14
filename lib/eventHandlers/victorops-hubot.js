var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');
var fixVictorOpsAlert = require('../fixVictorOpsAlert');
var request = require('request');

var logger = require('../logger').forModule('Victorops Hubot webhook handler');
var eventEmitter = require('../events');

function buildModelAndEmitAsEvent(victorOpData, model, event) {
	eventEmitter.emit(event, require('./models/' + model)(victorOpData));
}

var handlers = {
	'PROBLEM': function(alert) {
		if(alert.DISPLAY_ALERT_TYPE === 'warning') {
			return logger.logInfo('Hubot problem alert is warning, ignoring.', { VO_UUID: alert.VO_UUID });
		}

		logger.logInfo('VO ID: ' + alert.VO_UUID + ', is Incident No.: ' + alert.INCIDENT_NAME);

		buildModelAndEmitAsEvent(alert, 'incident-name', 'victorops-incident-name');
	},
	'ACKNOWLEDGEMENT': function(acknowledgement) {
		logger.logInfo('Incident No.: ' +  acknowledgement.INCIDENT_NAME + ' has been Ack\'ed by: ' + acknowledgement.NOTIFICATIONAUTHOR);

		buildModelAndEmitAsEvent(acknowledgement, 'acknowledgement', 'victorops-acknowledgement');
	},
	'RECOVERY': function(resolution) {
		if(!resolution.INCIDENT_NAME) {
			return logger.logInfo('Recovery from non incident, ignoring.');
		}

		logger.logInfo('Incident No.: ' + resolution.INCIDENT_NAME + ' has Recovered');

		buildModelAndEmitAsEvent(resolution, 'recovery', 'victorops-recovery');
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
		start: function(credentials) {
			logger.logInfo('VictorOps Hubot handler configured')
		},
		handle: function (teams, pipelineEvent) {
			logger.logInfo('VictorOps hubot message', pipelineEvent);

			var victoropsMessage = pipelineEvent.message;

			handle(pipelineEvent.message);
		}
	};
};
