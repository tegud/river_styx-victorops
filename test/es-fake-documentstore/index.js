var http = require('http');
var Promise = require('bluebird');
var _ = require('lodash');

module.exports = function() {
	var indicies = {};

	var documentRegex = /\/([^\/^?]+)\/([^\/^?]+)\/([^\/^?]+)(\/( [^\/^?]+))?/i;

	var server = http.createServer(function(request, response) {
		var urlMatches = request.url.match(documentRegex);
		var index = urlMatches[1];
		var type = urlMatches[2];
		var id = urlMatches[3];
		var method = urlMatches[5];

		if(!indicies[index]) {
			indicies[index] = {};
		}
		if(!indicies[index][type]) {
			indicies[index][type] = {};
		}

		var body = '';

		request.on('data', function(chunk) {
			body += chunk;
		});

		request.on('end', function() {
			var parsedBody = JSON.parse(body);
			if(!indicies[index][type][id]) {
				indicies[index][type][id] = parsedBody.doc;
			}
			else {
				_.merge(indicies[index][type][id], parsedBody.upsert);
			}

			response.writeHead(200, {"Content-Type": "text/html"});
			response.end();
		});
	});

	return {
		start: function() {
			server.listen(9200);
		},
		get: function(index, type, id) {
			return new Promise(function(resolve, reject) {
				if(!indicies[index]) {
					return reject('Index missing');
				}

				if(!indicies[index][type]) {
					return reject('Type missing');
				}

				if(!indicies[index][type][id]) {
					return reject('Document missing');
				}

				resolve(indicies[index][type][id]);
			});

		},
		reset: function() {

		},
		stop: function() {
			server.close();
		}
	}
};
