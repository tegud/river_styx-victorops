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

function snakeCaseToCamel(input) {
	var find = /(_\w)/g;
	var convert =  function(matches){
	    return matches[1].toUpperCase();
	};
	return input.replace(find, convert);
}

var validProperties = {
	incident: true,
	monitoring_tool: true,
	state_start_time: true,
	timestamp: '@timestamp',
	hostname: true,
	notificationtype: 'notification_type',
	vo_alert_type: true,
	vo_alert_rcv_time: 'voAlertReceivedTime',
	entity_display_name: true,
	hostalias: 'host_alias',
	lastservicestatechange: 'last_service_state_change',
	lasthoststatechange: 'last_host_state_change',
	contactgroupname: 'contact_group_name',
	message_type: true,
	alert_type: true,
	serviceoutput: 'service_output',
	host_name: true,
	vo_uuid: true,
	entity_state: true,
	last_host_state_change: true,
	ack_author: true,
	entity_id: true,
	servicedisplayname: 'service_display_name',
	state_message: true,
	vo_routing_keys: true,
	message: true,
	_contactvo_monitor_name: 'icinga_instance',
	servicedesc: 'service_desc',
	servicestate: 'service_state',
	hoststate: 'host_state',
	entity_is_host: true,
	routing_key: true,
	vo_monitor_type: true,
	summary: true,
	hostdisplayname: 'host_display_name'
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
	},
	pruneProperties: function(alert) {
		return _.reduce(alert, function(prunedObject, value, key) {
			if(!validProperties[key]) {
				return prunedObject;
			}

			var newKey;

			if(typeof validProperties[key] === 'string') {
				newKey = validProperties[key];
			}
			else {
				newKey = key;
			}

			prunedObject[snakeCaseToCamel(newKey)] = value;

			return prunedObject;
		}, {});
	}
};
