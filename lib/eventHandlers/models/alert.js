function setAlert(data) {
	upsertAlert(data.voUuid, data)
		.then(function() {
			logger.logInfo('Victorops alert stored to ES', { victorOpsId: data.voUuid });
		});
}
