const http = require('http');
const request = require('request');
const mapVictorOpsToAlert = require('./victorops-to-alert');

const logger = require('../logger').forModule('Victorops webhook handler');
const eventEmitter = require('../events');


module.exports = function() {
	return {
		start: credentials => logger.logInfo('VictorOps handler configured', { credentials: JSON.stringify(credentials) }),
		handle: (teams, pipelineEvent) => {
			const alert = pipelineEvent.message;

			logger.logInfo('VictorOps alert In.', { VOID: alert.vo_uuid });
			logger.logInfo(JSON.stringify(alert, null, 4));

			eventEmitter.emit('victorops-alert', mapVictorOpsToAlert(teams, alert));

			logger.logInfo(`Stored alert: ${alert.voUuid}`);
		}
	};
};
