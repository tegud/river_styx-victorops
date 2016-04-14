var logger = require('../../logger').forModule('Elasticsearch Publisher')

module.exports = function setAlert(client, data) {
	logger.logInfo('Storing Victorops alert to ES', { voId: data.voUuid });

	client.upsert(data.voUuid, data)
		.then(() => logger.logInfo('Victorops alert stored to ES', { voId: data.voUuid }));
};
