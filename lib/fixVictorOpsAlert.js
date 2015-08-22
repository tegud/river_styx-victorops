var _ = require('lodash');
var moment = require('moment');

var cleanUpRegex = /^"(.+)"$/i;

var typeCorrections = {
	'incident': 'int',
	'vo_monitor_type': 'int',
	'state_start_time': 'dateTime',
	'timestamp': 'dateTime',
	'vo_alert_rcv_time': 'dateTime'
};

var parsers = {
	'int': function(value) {
		var parsedInt = parseInt(value, 10);

		if(isNaN(parsedInt)) {
			return value;
		}

		return parsedInt;
	},
	'dateTime': function(value) {
		while(value.toString().length < 13) {
			value += '0';
		}

		return moment(parseInt(value, 10)).utc().format();
	}
};

module.exports = {
	cleanUpStrings: function(alert) {
		return _.reduce(alert, function(correctedObject, value, key) {
			if(typeof value === 'string') {
				var cleanUpMatch = value.match(cleanUpRegex);

				if(cleanUpMatch) {
					value = cleanUpMatch[1];
				}
			}

			correctedObject[key] = value;

			return correctedObject;
		}, {});
	},
	correctTypes: function(alert) {
		return _.reduce(alert, function(correctedObject, value, key) {
			if(typeCorrections[key] && parsers[typeCorrections[key]]) {
				value = parsers[typeCorrections[key]](value);
			}

			correctedObject[key] = value;

			return correctedObject;
		}, {});
	}
};
