var expect = require('expect.js');
var Promise = require('bluebird');
var proxyquire = require('proxyquire');
var amqpSub = require('./amqp-sub');
var fs = require('fs');
var nock = require('nock');
var logger = require('../lib/logger').forModule('Integration Test');
var events = require('../lib/events');
var App = proxyquire('../lib/server', {
	'./config': function() {
		return {
			load: function() {
				return new Promise(function(resolve, reject) {
					resolve({ teams: {}, credentials: {}, elasticsearch: { host: 'localhost' } });
				});
			}
		};
	}
});
var FakeEsSocumentStore = require('./es-fake-documentstore');

function waitFor(time) {
	return function() {
		return new Promise(function(resolve, reject) {
			setTimeout(function() { resolve(); }, time);
		});
	};
}

expectObjectToHaveProperties = function(obj) {
	var assertions = this;

	Object.keys(assertions).forEach(function(property) {
		expect(obj).to.have.property(property, assertions[property]);
	});
};

describe('river_styx-victorops', function() {
	var fakeEsSocumentStore;
	var inputExchange;

	beforeEach(function() {
		var mockAmqpServer = amqpSub.mock({ host: '127.0.0.1', port: 5672 })
		inputExchange = mockAmqpServer.exchange('river-styx');
		fakeEsSocumentStore = new FakeEsSocumentStore();
		fakeEsSocumentStore.start();
		events.removeAllListeners();
	});

	afterEach(function() {
		fakeEsSocumentStore.stop();
		amqpSub.reset();
	});

	describe('victorops webhook alert', function() {
		it('is stored to elasticsearch', function(done) {
			new App({ elasticsearch: { host: 'localhost' } })
				.start()
				.then(function() { 
					inputExchange.publish('', fs.readFileSync(__dirname + '/data/justalert.json')); 
				})
				.then(waitFor(100))
				.then(fakeEsSocumentStore.get.bind(undefined, 'releases-2015.09', 'victoropsAlert', 'b295e252-67f2-4317-ab51-fa2856f4fb2d'))
				.then(function(storedDocument) {
					expect(storedDocument).to.eql({
					    "incident": 7794913,
					    "monitoringTool": "NewRelic",
					    "stateStartTime": "2015-08-23T00:10:13+00:00",
					    "@timestamp": "2015-08-23T00:10:13+00:00",
					    "notificationType": "PROBLEM",
					    "voAlertType": "SERVICE",
					    "voAlertReceivedTime": "2015-08-23T00:10:13+00:00",
					    "entityDisplayName": "Apdex score &lt; 0.7",
					    "messageType": "CRITICAL",
					    "alertType": "PROBLEM",
					    "hostName": "\"\"",
					    "voUuid": "b295e252-67f2-4317-ab51-fa2856f4fb2d",
					    "entityState": "CRITICAL",
					    "ackAuthor": "\"\"",
					    "entityId": "NewRelic-Apdex score &lt; 0.7-17039499-",
					    "stateMessage": "New alert for BookingWeb: Apdex score &lt; 0.7",
					    "icingaInstance": "NewRelic",
					    "serviceDesc": "NewRelic-Apdex score &lt; 0.7-17039499-",
					    "message": "Apdex score &lt; 0.7",
					    "entityIsHost": "false",
					    "routingKey": "newRelic",
					    "voMonitorType": 6,
					    "summary": "PROBLEM  NewRelic-Apdex score &lt; 0.7-17039499- CRITICAL",
					    "team": "Unknown"
		            });
				})
				.then(done)
				.catch(function(e) {
					expect(e).to.be(null); 
				});
		});
	});

	describe('victorops webhook and hubot', function() {
		it('incident name is stored to elasticsearch', function(done) {
			new App({ elasticsearch: { host: 'localhost' } })
				.start()
				.then(function() { 
					var events = JSON.parse(fs.readFileSync(__dirname + '/data/alertThenName.json'));

					while(events.length) {
						inputExchange.publish('', JSON.stringify(events.shift())); 
					}
				})
				.then(waitFor(100))
				.then(fakeEsSocumentStore.get.bind(undefined, 'releases-2015.09', 'victoropsAlert', 'b295e252-67f2-4317-ab51-fa2856f4fb2d'))
				.then(expectObjectToHaveProperties.bind({ 
	            	"incidentName": '1234'
				}))
				.then(done);
		});

		it('incident acknowledgment is stored to elasticsearch', function(done) {
			fakeEsSocumentStore.setSearchResponse('releases-2015.09', {"query":{"filtered":{"filter":{"bool":{"must":[{"range":{"@timestamp":{"from":"now-12h"}}},{"term":{"_type":"victoropsAlert"}},{"term":{"incidentName":"1234"}}]}}}},"size":1}, {
				hits: {
					hits: [
						{ _source: { voUuid: "b295e252-67f2-4317-ab51-fa2856f4fb2d", voAlertReceivedTime: 1441454375000 } }
					]
				}
			});

			new App({ elasticsearch: { host: 'localhost' } })
				.start()
				.then(function() { 
					var events = JSON.parse(fs.readFileSync(__dirname + '/data/alertThenAcknowledgement.json'));

					while(events.length) {
						inputExchange.publish('', JSON.stringify(events.shift())); 
					}
				})
				.then(waitFor(100))
				.then(fakeEsSocumentStore.get.bind(undefined, 'releases-2015.09', 'victoropsAlert', 'b295e252-67f2-4317-ab51-fa2856f4fb2d'))
				.then(expectObjectToHaveProperties.bind({ 
					"acknowledged": true,
					"acknowledgedBy": 'someperson',
					"acknowledgedAt": '2015-09-05T12:59:45+01:00',
					"timeToAcknowledgement": 10000 
				}))
				.then(done);
		});

		it('incident resolution is stored to elasticsearch', function(done) {
			fakeEsSocumentStore.setSearchResponse('releases-2015.09', {"query":{"filtered":{"filter":{"bool":{"must":[{"range":{"@timestamp":{"from":"now-12h"}}},{"term":{"_type":"victoropsAlert"}},{"term":{"incidentName":"1234"}}]}}}},"size":1}, {
				hits: {
					hits: [
						{ _source: { voUuid: "b295e252-67f2-4317-ab51-fa2856f4fb2d", voAlertReceivedTime: 1441454375000 } }
					]
				}
			});

			new App({ elasticsearch: { host: 'localhost' } })
				.start()
				.then(function() { 
					var events = JSON.parse(fs.readFileSync(__dirname + '/data/alertThenAcknowledgedAndResolved.json'));

					while(events.length) {
						inputExchange.publish('', JSON.stringify(events.shift())); 
					}
				})
				.then(waitFor(100))
				.then(fakeEsSocumentStore.get.bind(undefined, 'releases-2015.09', 'victoropsAlert', 'b295e252-67f2-4317-ab51-fa2856f4fb2d'))
				.then(expectObjectToHaveProperties.bind({ 
					'resolved': true,
					'resolvedAt': '2015-09-05T13:03:26+01:00', 
					'timeToResolution': 231000
				}))
				.then(done);
		});
	});
});
