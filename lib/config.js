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

module.exports = function() {
	return {
		load: function() {
			return Promise.all([
					loadConfig('teams.json'),
					loadConfig('credentials.json'),
					loadConfig('elasticsearch.json')
				]).then(function(results) {
				return new Promise(function(resolve, reject) {
					resolve({
						teams: results[0],
						credentials: results[1],
						elasticsearch: results[2]
					});
				})
			});
		}
	};
};
