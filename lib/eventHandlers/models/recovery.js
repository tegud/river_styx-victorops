module.exports = function(victorOpsResolution) {
	return {
		incidentName: victorOpsResolution.INCIDENT_NAME,
		timestamp: victorOpsResolution.TIMESTAMP
	};
};
