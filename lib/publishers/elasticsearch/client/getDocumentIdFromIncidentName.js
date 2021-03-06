var http = require('http');
var moment = require('moment');
var _ = require('lodash');

var logger = require('../../../logger').forModule('Elasticsearch Publisher');

function buildIncidentNameSearch(incidentName) {
	return {
		"query":{
			"filtered":{
				"filter":{
					"bool":{
						"must":[
							{
								"term": {
									"_type": "victoropsAlert"
								}
							},
							{
								"term": {
									"incidentName": incidentName
								}
							}
						]
					}
				}
			}
		},
		"size":1
	};
}

function getDocumentIdFromIncidentName(config, incidentName) {
	const index = `releases-${moment().format('YYYY.MM')}`;

	return new Promise(function(resolve, reject) {
		var request =  http.request({
			host: config.host,
			port: config.port,
			path: `/${index}/_search`,
			method: 'POST'
		}, function(response) {
			var allData = '';

			response.on('data', function (chunk) {
				allData += chunk;
			});

			response.on('end', function () {
				var parsedData = JSON.parse(allData);

				var hits = _.get(parsedData, 'hits.hits');

				if(!hits || !hits.length) {
					reject('Could not retrieve elasticsearch reference');
					return logger.logInfo('Failed retrieving full incident record from ES', {
						index: index,
						incidentName: incidentName,
						esResponse: allData
					});
				}

				logger.logInfo('VO ID Found for incident name', { incidentName: incidentName, voId: hits[0]['_source'].voUuid });

				resolve(hits[0]['_source']);
			});
		});

		request.write(JSON.stringify(buildIncidentNameSearch(incidentName)));

		request.end();
	});
}

module.exports = getDocumentIdFromIncidentName;
