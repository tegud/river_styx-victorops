var logger = require('../../logger').forModule('Victorops IncidentName Model');

module.exports = function(victorOpsAlert) {
	logger.logInfo('Building incident-name model for victorops hubot alert');

	return {
		voId: victorOpsAlert.VO_UUID, 
		incidentName: victorOpsAlert.INCIDENT_NAME
	};
};
