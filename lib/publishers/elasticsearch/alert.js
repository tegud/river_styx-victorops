var logger = require('../../logger').forModule('Elasticsearch Publisher');
var upsertAlert = require('./upsert');

function setAlert(data) {
	upsertAlert(data.voUuid, data)
		.then(function() {
			logger.logInfo('Victorops alert stored to ES', { victorOpsId: data.voUuid });
		});
}

module.exports = setAlert;
