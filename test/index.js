var expect = require('expect.js');
var Promise = require('bluebird');
var proxyquire = require('proxyquire');
var amqpSub = require('./amqp-sub');
var fs = require('fs');
var nock = require('nock');
var logger = require('../lib/logger').forModule('Integration Test');
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

describe('river_styx-victorops', function() {
	var fakeEsSocumentStore;

	beforeEach(function() {
		fakeEsSocumentStore = new FakeEsSocumentStore();
		fakeEsSocumentStore.start();

	});

	afterEach(function() {
		fakeEsSocumentStore.stop();
	});

	describe('victorops webhook alert', function() {
		it.only('is stored to elasticsearch', function(done) {
			var mockAmqpServer = amqpSub.mock({ host: '127.0.0.1', port: 5672 })
			inputExchange = mockAmqpServer.exchange('river-styx');

			var expectedAlertEsRecord = {
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
            };

			new App({
					elasticsearch: {
						host: 'localhost'
					}
				})
				.start()
				.then(function() { 
					inputExchange.publish('', fs.readFileSync(__dirname + '/data/justalert.json')); 
				})
				.then(waitFor(100))
				.then(fakeEsSocumentStore.get.bind(undefined, 'releases-2015.09', 'victoropsAlert', 'b295e252-67f2-4317-ab51-fa2856f4fb2d'))
				.then(function(storedDocument) {
					expect(storedDocument).to.eql(expectedAlertEsRecord);
					done();
				})
				.catch(function(e) {
					expect(e).to.be(null); 
				});
		});
	});

	describe('victorops webhook and hubot', function() {
		it('incident name is stored to elasticsearch', function(done) {
			var mockAmqpServer = amqpSub.mock({ host: '127.0.0.1', port: 5672 })
			inputExchange = mockAmqpServer.exchange('river-styx');

			var expectedAlertEsRecord = {
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
            };

            var expectedNameEsUpdate = {
			    voUuid: "b295e252-67f2-4317-ab51-fa2856f4fb2d",
            	incidentName: '1234'
            };

			var storeToEs = nock('http://localhost:9200')
                .post('/releases-2015.09/victoropsAlert/b295e252-67f2-4317-ab51-fa2856f4fb2d/_update?retry_on_conflict=3', {
                	doc: expectedAlertEsRecord,
                	upsert: expectedAlertEsRecord
                })
                .reply(200, { })
                .post('/releases-2015.09/victoropsAlert/b295e252-67f2-4317-ab51-fa2856f4fb2d/_update?retry_on_conflict=3', {
                	doc: expectedNameEsUpdate,
                	upsert: expectedNameEsUpdate
                })
                .reply(200, { })
                .log(console.log);

			new App({
					elasticsearch: {
						host: 'localhost'
					}
				})
				.start()
				.then(function() { 
					var events = JSON.parse(fs.readFileSync(__dirname + '/data/alertThenName.json'));

					while(events.length) {
						inputExchange.publish('', JSON.stringify(events.shift())); 
					}
				})
				.then(function() {
					setTimeout(function() {
						storeToEs.done();
						console.log('>>>>>>>> Test Complete');
						done();
					}, 1000);
				});
		});
	});
});
