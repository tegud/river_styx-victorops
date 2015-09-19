var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');
var logger = require('../logger').forModule('Zendesk Publisher');
var events = require('../events');
var request = require('request');

module.exports = function ZendeskIncident() {
	function sendIncidentToZendesk(credentials, alert) {
		var currentHour = moment().hour();

		if(currentHour > 7 && currentHour < 18) {
			return logger.logInfo('Not creating incident in business hours for now.', { currentHour: currentHour });
		}

	 	var encoded = new Buffer(credentials.apiUser + '/token:' + credentials.apiToken).toString('base64');

		request({
			url: 'https://' + credentials.subDomain + '.zendesk.com/api/v2/tickets.json',
			method: 'POST',
			body: {
				"ticket": {
					subject:  alert.message,
					comment:  { body: alert.message },
					custom_fields: [
						{ id: 27210271, value: "inc_bs_automated_alerting_victorops" }
					]
				}
			},
			json: true,
			headers: {
				'Authorization': 'Basic ' + encoded,
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		}, function(err, response, body) {
			if(response.statusCode !== 201) {
				return logger.logInfo('Could not save zendesk ticket', { responseStatusCode: response.statusCode });
			}

			logger.logInfo('Incident created in zendesk', { zendeskId: body.ticket.id });

			events.emit('victorops-zendeskId', {
				zendeskId: body.ticket.id,
				voUuid: alert.voUuid
			});
		});
	}

	return {
		start: function(credentials) {
			logger.logInfo('Starting zendesk publisher');

			return new Promise(function(resolve, reject) {
				events.on('victorops-alert', sendIncidentToZendesk.bind(undefined, credentials));
				resolve();
			});
		}
	};
};
