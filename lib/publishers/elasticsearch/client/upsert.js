const http = require('http');
const moment = require('moment');
const Promise = require('bluebird');

const logger = require('../../../logger').forModule('Elasticsearch Publisher');

function upsertAlert(config, id, alert) {
	return new Promise(function(resolve, reject) {
		const index = `releases-${moment().format('YYYY.MM')}`;
		const type = 'victoropsAlert';
		const documentId = `${config.idPrefix || ''}${id}`;

		logger.logInfo('Upserting elasticsearch alert record', { id: id, host: config.host, port: config.port, index: index, type: type, data: JSON.stringify(alert, null, 4) });

		const request =  http.request({
			host: config.host,
			port: config.port,
			path: `/${index}/${type}/${documentId}/_update?retry_on_conflict=3`,
			method: 'POST'
		}, function(response) {
			const allData = '';

			response.on('data', function (chunk) {
				allData += chunk;
			});

			response.on('end', function () {
				logger.logInfo('Elasticsearch alert upsert complete', { esResponse: JSON.parse(JSON.stringify(allData, null, 4))});
				resolve();
			});
		});

		request.write(JSON.stringify({
			"doc": alert,
			"upsert" : alert
		}));

		request.on('error', e => reject(logger.logError('Could not upsert Elasticsearch alert record', { error: e, id: id, host: config.host, port: config.port })));

		request.end();
	});
}

module.exports = upsertAlert;
