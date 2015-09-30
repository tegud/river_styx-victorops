var fs = require('fs');
var Promise = require('bluebird');

function loadConfig(file) {
	return new Promise(function(resolve, reject) {
		fs.readFile(__dirname + '/../' + file, 'utf-8', function(err, data) {
			if(err) {
				return reject(err);
			}

			resolve(JSON.parse(data));
		})
	});
}

function loadConfigs() {
	var files = Array.prototype.slice.call(arguments);

	return Promise.all(files.map(function(configFile) {
		return loadConfig(configFile);
	});
}

function combineResults(results) {
	return new Promise(function(resolve, reject) {
		resolve({
			teams: results[0],
			credentials: results[1],
			elasticsearch: results[2]
		});
	})
}

module.exports = function() {
	return {
		load: function() {
			return loadConfigs('teams.json', 'credentials.json', 'elasticsearch.json').then(combineResults);
		}
	};
};
