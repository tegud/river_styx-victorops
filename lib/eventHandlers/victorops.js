var http = require('http');
var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');

var logger = require('../logger').forModule('Victorops webhook handler');
var eventEmitter = require('../events');

module.exports = function() {
	return {
		handle: function (teams, pipelineEvent) {
			var alert = pipelineEvent.message;

			
		}
	};
};