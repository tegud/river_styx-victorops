var moment = require('moment');
var _ = require('lodash');
var logger = require('../logger').forModule('Zendesk Publisher');
var events = require('../events');
var request = require('request');

module.exports = function ZendeskIncident() {
	function sendIncidentToZendesk(credentials, alert) {
		if(alert.zendeskId) {
			return;
		}

	 	const encoded = new Buffer(`${credentials.apiUser}/token:${credentials.apiToken}`).toString('base64');
		const url = `https://${credentials.subDomain}.zendesk.com/api/v2/tickets.json`;

		request({
			url: url,
			method: 'POST',
			body: {
				"ticket": {
					subject:  `Critical Alert: ${alert.service}`,
					comment:  { body: `A critical alert was raised for ${alert.service}` },
					custom_fields: [
						{ id: 27210271, value: "inc_bs_automated_alerting_victorops" }
					]
				}
			},
			json: true,
			headers: {
				'Authorization': `Basic ${encoded}`,
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		}, (err, response, body) => {
			if(err) {
				return logger.logError('Could not save zendesk ticket', { url: url, error: err });
			}

			if(response.statusCode !== 201) {
				return logger.logError('Could not save zendesk ticket', { url: url, responseStatusCode: response.statusCode });
			}

			logger.logInfo('Incident created in zendesk', { zendeskId: body.ticket.id });

			events.emit('victorops-zendeskId', {
				zendeskId: body.ticket.id.toString(),
				alertId: alert.incidentName
			});
		});
	}

	return {
		start: function(config) {
			var credentials = config.credentials;
			logger.logInfo('Starting zendesk publisher');

			return new Promise((resolve, reject) => {
				events.on('victorops-alert', alert => sendIncidentToZendesk(credentials, alert));
				resolve();
			});
		}
	};
};
