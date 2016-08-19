const should = require('should');
const nock = require('nock');
const proxyquire = require('proxyquire');
const events = require('events');

let testEventHandlers = {};
let onTestEvent;

const ZendeskPublisher = proxyquire('../../lib/publishers/zendesk', {
    '../events': {
        on: (name, handler) => {
            testEventHandlers[name] = handler;
        },
        emit: (name, data) => {
            if(!onTestEvent) {
                return;
            }

            onTestEvent(name, data);
        }
    }
});

let eventHandler;

function emitTestAlert(name, data) {
    new Promise((resolve, reject) => {
        if(!testEventHandlers[name]) {
            console.error(`No bound event handlers for '${name}'`);
            return reject();
        }

        testEventHandlers[name](data);
        resolve();
    });
}

function waitFor(time) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), 1000);
	});
}

describe('Zendesk publisher', () => {
    beforeEach(() => {
        nock.cleanAll();
        testEventHandlers = {};
        onTestEvent = undefined;
    });

    it('creates ticket for unacked status alerts to zendesk', () => {
        const zendesk = new ZendeskPublisher();

        const scope = nock('https://test.zendesk.com')
            .post('/api/v2/tickets.json', {
                "ticket": {
                    subject:  "Critical Alert: disk space/db01.mycompany.com",
                    comment:  { body: "A critical alert was raised for disk space/db01.mycompany.com" },
                    custom_fields: [
                        { id: 27210271, value: "inc_bs_automated_alerting_victorops" }
                    ]
                }
            })
            .reply(201, JSON.stringify({
                ticket: { id: 0 }
            }));

        return zendesk.start({ credentials: { apiUser: 'test', apiToken: '12345abcd', subDomain: 'test' } })
            .then(() => emitTestAlert('victorops-alert', { service: 'disk space/db01.mycompany.com' }))
            .then(() => waitFor(10))
            .then(() => {
                scope.done();
            });
    });

    it('does not create ticket when zendeskId present', () => {
        const zendesk = new ZendeskPublisher();

        const scope = nock('https://test.zendesk.com')
            .post('/api/v2/tickets.json', {
                "ticket": {
                    subject:  "Critical Alert: disk space/db01.mycompany.com",
                    comment:  { body: "A critical alert was raised for disk space/db01.mycompany.com" },
                    custom_fields: [
                        { id: 27210271, value: "inc_bs_automated_alerting_victorops" }
                    ]
                }
            })
            .reply(201, JSON.stringify({
                ticket: {}
            }));

        return zendesk.start({ credentials: { apiUser: 'test', apiToken: '12345abcd', subDomain: 'test' } })
            .then(() => emitTestAlert('victorops-alert', { service: 'disk space/db01.mycompany.com', zendeskId: 1234 }))
            .then(() => waitFor(10))
            .then(() => new Promise(resolve => resolve(scope.isDone())))
            .should.eventually.equal(false);
    });

    it('raises event to store zendeskId against the incident identifier', () => {
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
            .reply(201, JSON.stringify({
                ticket: { id: 5678 }
            }));

         new ZendeskPublisher().start({ credentials: { apiUser: 'test', apiToken: '12345abcd', subDomain: 'test' } })
            .then(() => {
                emitTestAlert('victorops-alert', { service: 'disk space/db01.mycompany.com', incidentName: '1234' });
            })

        return new Promise(resolve => onTestEvent = (name, data) => {
                if(name !== 'victorops-zendeskId') {
                    return;
                }

                resolve(data);
            })
            .should.eventually.eql({
                alertId: '1234',
                zendeskId: '5678'
            });
    });
});
