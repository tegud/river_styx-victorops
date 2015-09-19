module.exports = function(victorOpsAlert) {
	return {
		voId: victorOpsAlert.VO_UUID, 
		incidentName: victorOpsAlert.INCIDENT_NAME
	};
};
