var logger = require('../../logger').forModule('Elasticsearch Publisher')

function setAlert(client, data) {
	client.upsertAlert(data.voUuid, data)
		.then(function() {
			logger.logInfo('Victorops alert stored to ES', { victorOpsId: data.voUuid });
		});
}

module.exports = setAlert;
