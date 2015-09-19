var logger = require('../../logger').forModule('Elasticsearch Publisher')

function setAlert(client, data) {
	logger.logInfo('Storing Victorops alert to ES', { victorOpsId: data.voUuid });

	client.upsert(data.voUuid, data)
		.then(function() {
			logger.logInfo('Victorops alert stored to ES', { victorOpsId: data.voUuid });
		});
}

module.exports = setAlert;
