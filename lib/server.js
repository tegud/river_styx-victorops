var Promise = require('bluebird');
var _ = require('lodash');
var moment = require('moment');
var http = require('http');
var logger = require('./logger').forModule('River_styx victorops server');
var eventEmitter = require('./events');
var amqpListener = require('./amqp');
var amqpPublisher = require('./amqpPublisher');
var TeamConfiguration = require('./teamConfiguration')
var handlers = require('./eventHandlers');

var elasticsearchPublisher = require('./publishers/elasticsearch');
var zendeskPublisher = require('./publishers/zendesk');

var configLoader = require('./config');

logger.logInfo('Starting Victorops Incident and On Call Handler');

function handleMessage(teams, event) {
	handlers
		.handle(event.type, teams, event)
		.catch(exception => logger.logError('Error whilst handling event: ' + exception.message, { handler: event.type }));
}

module.exports = function() {
	logger.logInfo('Starting up...');

	return {
		start: function() {
			return new configLoader().load()
				.then(config => {
					logger.logInfo('Initialising Modules');

					var teams = new TeamConfiguration(config.teams);

					var listener = new amqpListener(handleMessage.bind(undefined, teams), config.amqp.listen);

					var publisher = new amqpPublisher(logger, config.amqp.publish);

					return Promise.all([
						listener.start(),
						publisher.start(),
						handlers.start(config),
						new elasticsearchPublisher().start(config),
						new zendeskPublisher().start(config)
					]);
				})
				.then(() => {
					logger.logInfo('Handler startup complete');

					return new Promise(resolve => {
						eventEmitter.on('river_styx_event', event => {
							publisher.publish(event.type, _.merge(event, {
						    	origin: 'pentlrges03'
							}));
						});

						logger.logInfo('Startup Complete');

						resolve();
					});
				})
				.catch(err => logger.logError('Error during startup: ' + err));
		}
	};
};
