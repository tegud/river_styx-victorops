const should = require('should');
const proxyquire = require('proxyquire');
const amqpSub = require('./lib/amqp-sub');
const fs = require('fs');
const nock = require('nock');
const moment = require('moment');
const logger = require('../lib/logger').forModule('Integration Test');
const events = require('../lib/events');
const App = proxyquire('../lib/server', {
	'./config': function() {
		return {
			load: () => new Promise((resolve, reject) => resolve({
                amqp: {
					listen: { host: '127.0.0.1', port: 5672, exchange: 'river-styx', queue: 'test' },
					publish: { host: '127.0.0.1', port: 5672, exchange: 'river-styx' }
				},
                elasticsearch: { host: 'localhost', idPrefix: 'test-prefix-' },
				teams: {},
				credentials: {
					apiUser: '', apiToken: '', subDomain: 'test'
				}
            }))
		};
	}
});
const FakeEsDocumentStore = require('./lib/es-fake-documentstore');

describe('river_styx-victorops', () => {
	let fakeEsSocumentStore;
	let inputExchange;

	beforeEach(() => {
		const mockAmqpServer = amqpSub.mock({ host: '127.0.0.1', port: 5672 })
		inputExchange = mockAmqpServer.exchange('river-styx');
		fakeEsSocumentStore = new FakeEsDocumentStore();
		fakeEsSocumentStore.start();
		events.removeAllListeners();
	});

	afterEach(() => {
		fakeEsSocumentStore.stop();
		amqpSub.reset();
	});

	function waitFor(time) {
		return new Promise(resolve => {
			setTimeout(() => resolve(), 1000);
		});
	}

	describe('victorops webhook alert', () => {
		it('is stored to elasticsearch', () => {
			new App()
				.start()
				.then(() => inputExchange.publish('', JSON.stringify({
					"type": "victoropsv2-incident",
					"message": {
					    incident: {
					        entityType: 'SERVICE'
					    },
					    alert: {
					        serviceState: 'CRITICAL',
					        receiveTime: 1469698739694,
					        url: '',
					        entity: {
					            displayName: 'disk space/db01.mycompany.com',
					            state: 'CRITICAL'
					        },
					        messageType: 'CRITICAL',
					        monitorName: '',
					        monitoringTool: 'API',
					        routingKey: '',
					        timestamp: 1469698739694
					    },
					    state: {
					        ack: {
					            message: '',
					            user: 'SYSTEM',
					            timestamp: 0
					        },
					        alertCount: '1',
					        currentAlertPhase: 'UNACKED',
					        currentState: 'CRITICAL',
					        entityId: 'disk space/db01.mycompany.com',
					        host: '',
					        name: '7321',
					        timestamp: 1469698739694,
					        lastTimestamp: 0,
					        monitorType: 'API',
					        service: 'disk space/db01.mycompany.com'
					    }
					}
				})));

			return waitFor(50)
				.then(fakeEsSocumentStore.get.bind(undefined, `releases-${moment().format('YYYY.MM')}`, 'victoropsAlert', 'test-prefix-7321'))
				.should.eventually.eql({
					"@timestamp": "2016-07-28T09:38:59Z",
					team: "Unknown",
					startedAt: '2016-07-28T09:38:59Z',
					acknowledged: false,
                    resolved: false,
					incidentName: '7321',
					host: '',
					service: 'disk space/db01.mycompany.com',
					monitoringTool: 'API',
				    incident: {
				        entityType: 'SERVICE'
				    },
				    alert: {
				        serviceState: 'CRITICAL',
				        receiveTime: '2016-07-28T09:38:59Z',
				        url: '',
				        entity: {
				            displayName: 'disk space/db01.mycompany.com',
				            state: 'CRITICAL'
				        },
				        messageType: 'CRITICAL',
				        monitorName: '',
				        monitoringTool: 'API',
				        routingKey: '',
				        timestamp: '2016-07-28T09:38:59Z'
				    },
				    state: {
				        ack: {
				            message: '',
				            user: 'SYSTEM',
				        },
				        alertCount: '1',
				        currentAlertPhase: 'UNACKED',
				        currentState: 'CRITICAL',
				        entityId: 'disk space/db01.mycompany.com',
				        host: '',
				        name: '7321',
				        timestamp: '2016-07-28T09:38:59Z',
				        monitorType: 'API',
				        service: 'disk space/db01.mycompany.com'
				    }
				});
			});

		it('sets the zendeskId on the release', () => {
			const scope = nock('https://test.zendesk.com')
				.log(console.log)
				.post('/api/v2/tickets.json', {
					"ticket": {
						subject:  "Critical Alert: disk space/db01.mycompany.com",
						comment:  { body: "A critical alert was raised for disk space/db01.mycompany.com" },
						custom_fields: [
							{ id: 27210271, value: "inc_bs_automated_alerting_victorops" }
						]
					}
				})
				.reply(201, JSON.stringify({ ticket: { id: 1234 } }));

			new App()
				.start()
				.then(() => inputExchange.publish('', JSON.stringify({
					"type": "victoropsv2-incident",
					"message": {
					    incident: {
					        entityType: 'SERVICE'
					    },
					    alert: {
					        serviceState: 'CRITICAL',
					        receiveTime: 1469698739694,
					        url: '',
					        entity: {
					            displayName: 'disk space/db01.mycompany.com',
					            state: 'CRITICAL'
					        },
					        messageType: 'CRITICAL',
					        monitorName: '',
					        monitoringTool: 'API',
					        routingKey: '',
					        timestamp: 1469698739694
					    },
					    state: {
					        ack: {
					            message: '',
					            user: 'SYSTEM',
					            timestamp: 0
					        },
					        alertCount: '1',
					        currentAlertPhase: 'UNACKED',
					        currentState: 'CRITICAL',
					        entityId: 'disk space/db01.mycompany.com',
					        host: '',
					        name: '7321',
					        timestamp: 1469698739694,
					        lastTimestamp: 0,
					        monitorType: 'API',
					        service: 'disk space/db01.mycompany.com'
					    }
					}
				})));

				return waitFor(200)
					.then(fakeEsSocumentStore.get.bind(undefined, `releases-${moment().format('YYYY.MM')}`, 'victoropsAlert', 'test-prefix-7321'))
					.should.eventually.have.properties({ zendeskId: '1234' });
			});
		});
});
