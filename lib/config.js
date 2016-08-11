var fs = require('fs');

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
	}));
}

function combineResults(results) {
	return new Promise(function(resolve, reject) {
		resolve({
			teams: results[0],
			credentials: results[1],
			elasticsearch: results[2],
			amqp: results[3]
		});
	})
}

module.exports = function() {
	return {
		load: function() {
			return loadConfigs('teams.json', 'credentials.json', 'elasticsearch.json', 'amqp.json').then(combineResults);
		}
	};
};
