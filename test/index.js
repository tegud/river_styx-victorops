const should = require('should');
const proxyquire = require('proxyquire');
const amqpSub = require('./amqp-sub');
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
				teams: {}, credentials: {},
            }))
		};
	}
});
const FakeEsSocumentStore = require('./es-fake-documentstore');

function waitFor(time) {
	return () => new Promise(resolve => setTimeout(() => resolve(), time));
}

describe('river_styx-victorops', () => {
	let fakeEsSocumentStore;
	let inputExchange;

	beforeEach(() => {
		const mockAmqpServer = amqpSub.mock({ host: '127.0.0.1', port: 5672 })
		inputExchange = mockAmqpServer.exchange('river-styx');
		fakeEsSocumentStore = new FakeEsSocumentStore();
		fakeEsSocumentStore.start();
		events.removeAllListeners();
	});

	afterEach(() => {
		fakeEsSocumentStore.stop();
		amqpSub.reset();
	});

	describe('victorops webhook alert', function() {
		it('is stored to elasticsearch', done => new App()
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
			})))
			.then(waitFor(100))
			.then(fakeEsSocumentStore.get.bind(undefined, `releases-${moment().format('YYYY.MM')}`, 'victoropsAlert', 'test-prefix-7321'))
			.then(function(storedDocument) {
				storedDocument.should.eql({
					"@timestamp": "2016-07-28T09:38:59Z",
					team: "Unknown",
					startedAt: '2016-07-28T09:38:59Z',
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
			})
			.then(done));
		});
});
