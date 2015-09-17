var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');

var logger = require('../../../logger').forModule('Elasticsearch Publisher');

function buildIncidentNameSearch(incidentName) {
	return {
		"query":{
			"filtered":{
				"filter":{
					"bool":{
						"must":[
							{
								"range":{
									"@timestamp":{
										"from":"now-12h"
									}
								}
							},
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
	return new Promise(function(resolve, reject) {
		var request =  http.request({
			host: 'logs.laterooms.com',
			port: 9200,
			path: '/releases-' + moment().format('YYYY.MM') + '/_search',
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
					return logger.logInfo('Failed retrieving full incident record from ES', { incidentName: incidentName, esResponse: allData });
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
