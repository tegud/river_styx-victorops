var http = require('http');
var Promise = require('bluebird');
var _ = require('lodash');

module.exports = function() {
	var indicies = {};
	var searches = {};

	var documentRegex = /\/([^\/^?]+)\/([^\/^?]+)(\/([^\/^?]+)(\/( [^\/^?]+))?)?/i;

	function upsert(index, type, id, body) {
		if(!indicies[index]) {
			indicies[index] = {};
		}
		if(!indicies[index][type]) {
			indicies[index][type] = {};
		}

		if(!indicies[index][type][id]) {
			indicies[index][type][id] = body.doc;
		}
		else {
			_.merge(indicies[index][type][id], body.upsert);
		}
	}

	function search(index, body) {
		return searches[index + '-' + JSON.stringify(body)];
	}

	var server = http.createServer(function(request, response) {
		var urlMatches = request.url.match(documentRegex);
		var index = urlMatches[1];
		var type = urlMatches[2];
		var id = urlMatches[4];
		var method = urlMatches[6];

		var body = '';

		request.on('data', function(chunk) {
			body += chunk;
		});

		request.on('end', function() {
			var parsedBody = JSON.parse(body);
			var responseBody;

			if(type === '_search') {
				responseBody = search(index, parsedBody);
			}
			else {
				responseBody = upsert(index, type, id, parsedBody);
			}

			response.writeHead(200, {"Content-Type": "text/html"});
			response.end(JSON.stringify(responseBody));
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
		setSearchResponse: function(index, search, response) {
			searches[index + '-' + JSON.stringify(search)] = response;
		},
		reset: function() {

		},
		stop: function() {
			server.close();
		}
	}
};
