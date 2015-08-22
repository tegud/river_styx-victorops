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

logger.logInfo('Starting Victorops Incident and On Call Handler');

function handleMessage(teams, event) {
	handlers
		.handle(event.type, teams, event)
		.catch(function(exception) {
			logger.logError('Error whilst handling event: ' + exception.message, { handler: event.type });
		});
}

var teams = new TeamConfiguration(config.teams);

var listener = new amqpListener(handleMessage.bind(undefined, teams), logger, { 
	"host": "127.0.0.1", 
	"exchange": "river-styx", 
	"routing": "pipelineResult", 
	"queue": "pipelineResult-aggregator" 
});

var publisher = new amqpPublisher(logger, { 
	"host": "127.0.0.1", 
	"exchange": "river-styx"
});

listener.start().then(publisher.start).then(function() {
	eventEmitter.on('river_styx_event', function(event) {
		publisher.publish(event.type, _.merge(event, {
	    	origin: 'pentlrges03'
		}));
	});
	
	logger.logInfo('Startup Complete');
});
