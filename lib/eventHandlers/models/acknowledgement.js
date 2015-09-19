module.exports = function (victorOpsAcknowledgement) {
	return {
		incidentName: victorOpsAcknowledgement.INCIDENT_NAME,
		timestamp: victorOpsAcknowledgement.TIMESTAMP,
		acknowledgedBy: victorOpsAcknowledgement.NOTIFICATIONAUTHOR
	};
};
