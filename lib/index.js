var Promise = require('bluebird');
var _ = require('lodash');
var moment = require('moment');
var http = require('http');
var logger = require('./logger');
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
		.catch(function(exception) {
			logger.logError('Error whilst handling event: ' + exception.message, { handler: event.type });
		});
}

new configLoader().load().then(function(config) {
	var teams = new TeamConfiguration(config.teams);

	var listener = new amqpListener(handleMessage.bind(undefined, teams), logger, { 
		"host": "127.0.0.1", 
		"exchange": "river-styx", 
		"routing": "victorops", 
		"queue": "victorops-handler" 
	});

	var publisher = new amqpPublisher(logger, { 
		"host": "127.0.0.1", 
		"exchange": "river-styx"
	});

	Promise.all([
		listener.start(),
		publisher.start(),
		handlers.start(config.credentials),
		new elasticsearchPublisher().start(config.credentials),
		new zendeskPublisher().start(config.credentials)
	]).then(function() {
		eventEmitter.on('river_styx_event', function(event) {
			publisher.publish(event.type, _.merge(event, {
		    	origin: 'pentlrges03'
			}));
		});

		logger.logInfo('Startup Complete');
	});
});
