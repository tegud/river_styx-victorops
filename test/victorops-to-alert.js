const victoropsToAlert = require('../lib/eventHandlers/victorops-to-alert');
const should = require('should');

describe('Victor Ops to alert', () => {
    it('should set incidentName', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
        state: {
            name: "1234"
        }
    }).should.have.properties({ 'incidentName': '1234' }));

    it('should set monitoringTool', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
        state: {},
        alert: {
            monitoringTool: "API"
        }
    }).should.have.properties({ 'monitoringTool': 'API' }));

    it('should set host', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
        state: {
            host: "test-host"
        }
    }).should.have.properties({ 'host': 'test-host' }));

    it('should set service', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
        state: {
            service: "test-service"
        }
    }).should.have.properties({ 'service': 'test-service' }));

    // it('should set currentState', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
    //     state: {
    //         name: "1234"
    //     }
    // }).should.have.properties({ 'incidentName': '1234' }));

    it('should set startedAt', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
        state: {
            timestamp: 1469698739694
        }
    }).should.have.properties({'startedAt': '2016-07-28T09:38:59Z'}));

    it('should set acknowledged to false', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
        state: {
            timestamp: 1469698739694
        }
    }).should.have.properties({ 'acknowledged': false }));

    it('should set resolved to false', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
        state: {
            timestamp: 1469698739694
        }
    }).should.have.properties({ 'resolved': false }));

    describe('acknowledged alerts', () => {
        it('should set acknowledged to true', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
            state: {
                timestamp: 1469698739694
            }
        }).should.have.properties({ 'acknowledged': false }));

        it('should set acknowledgedAt', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
            state: {
                currentAlertPhase: 'ACKED',
                ack: {
                    timestamp: 1469698759694
                },
                timestamp: 1469698739694
            }
        }).should.have.properties({ 'acknowledgedAt': '2016-07-28T09:39:19Z' }));

        it('should set timeToAcknowledgement', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
            state: {
                currentAlertPhase: 'ACKED',
                ack: {
                    timestamp: 1469698759694
                },
                timestamp: 1469698739694
            }
        }).should.have.properties({ 'timeToAcknowledgement': 20000 }));

        it('should set acknowledgedBy', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
            state: {
                currentAlertPhase: 'ACKED',
                ack: {
                    user: 'testuser',
                    timestamp: 1469698759694
                },
                timestamp: 1469698739694
            }
        }).should.have.properties({ 'acknowledgedBy': 'testuser' }));
    });

    describe('resolved alerts', () => {
        it('should set resolved to true', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
            state: {
                currentAlertPhase: 'RESOLVED',
                timestamp: 1469698739694,
                lastTimestamp: 1469698779694
            }
        }).should.have.properties({ 'resolved': true }));

        it('should set resolvedAt', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
            state: {
                currentAlertPhase: 'RESOLVED',
                timestamp: 1469698739694,
                lastTimestamp: 1469698779694
            }
        }).should.have.properties({ 'resolvedAt': '2016-07-28T09:39:39Z' }));

        it('should set timeToResolution', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
            state: {
                currentAlertPhase: 'RESOLVED',
                timestamp: 1469698739694,
                lastTimestamp: 1469698779694
            }
        }).should.have.properties({ 'timeToResolution': 40000 }));
    });

    describe('resolved but not acknowledged alerts', () => {
        it('should set acknowledged to false', () => victoropsToAlert({ getTeamForAlert: () => {} }, {
            state: {
                ack: { message: '', user: '' },
                currentAlertPhase: 'RESOLVED',
                timestamp: 1469698739694,
                lastTimestamp: 1469698779694
            }
        }).should.have.properties({ 'acknowledged': false }));
    });
});
