var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');

var logger = require('../../../logger').forModule('Elasticsearch Publisher');

function upsertAlert(config, id, alert) {
	return new Promise(function(resolve, reject) {
		logger.logInfo('Upserting elasticsearch alert record', { id: id, host: config.host, port: config.port, data: JSON.stringify(alert, null, 4) });

		var request =  http.request({
			host: config.host,
			port: config.port,
			path: `/releases-${moment().format('YYYY.MM')}/victoropsAlert/${id}/_update?retry_on_conflict=3`,
			method: 'POST'
		}, function(response) {
			var allData = '';

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

		request.on('error', function(e) {
			return reject(logger.logError('Could not upsert Elasticsearch alert record', { error: e, id: id, host: config.host, port: config.port }));
		});

		request.end();
	});
}

module.exports = upsertAlert;
