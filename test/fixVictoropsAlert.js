var expect = require('expect.js');
var fixVictorOpsAlert = require('../lib/fixVictorOpsAlert');

describe('fixVictorOpsAlert', function() {
	describe('cleanUpStrings', function() {
		it('leaves valid strings alone', function() {
			expect(fixVictorOpsAlert.cleanUpStrings({ incident: '7781029' }).incident).to.be('7781029');
		});

		it('leaves removes redundant quote marks from beginning and end of strings', function() {
			expect(fixVictorOpsAlert.cleanUpStrings({ vo_routing_keys: '"TEST"' }).vo_routing_keys).to.be('TEST');
		});

		it('handles non-string types', function() {
			expect(fixVictorOpsAlert.cleanUpStrings({ vo_routing_keys: 1234 }).vo_routing_keys).to.be(1234);
		});
	});

	describe('correctTypes', function() {
		it('sets incident to an integer', function() {
			expect(fixVictorOpsAlert.correctTypes({ 
					incident: '7772152'
				}).incident).to.be(7772152);
		});

		it('sets vo_monitor_type to an integer', function() {
			expect(fixVictorOpsAlert.correctTypes({ 
					vo_monitor_type: '4'
				}).vo_monitor_type).to.be(4);
		});

		it('sets state_start_time to a DateTime string', function() {
			expect(fixVictorOpsAlert.correctTypes({ 
					state_start_time: '1440171136306'
				}).state_start_time).to.be('2015-08-21T15:32:16+00:00');
		});

		it('sets timestamp to a DateTime string', function() {
			expect(fixVictorOpsAlert.correctTypes({ 
					timestamp: '1440171104000'
				}).timestamp).to.be('2015-08-21T15:31:44+00:00');
		});

		it('sets vo_alert_rcv_time to a DateTime string', function() {
			expect(fixVictorOpsAlert.correctTypes({ 
					timestamp: '1440171136307'
				}).timestamp).to.be('2015-08-21T15:32:16+00:00');
		});

		it('handles short timestamps', function() {
			expect(fixVictorOpsAlert.correctTypes({ 
					timestamp: '1440216850'
				}).timestamp).to.be('2015-08-22T04:14:10+00:00');
		});

		it('handles short timestamps that are already integers', function() {
			expect(fixVictorOpsAlert.correctTypes({ 
					timestamp: 1440216850
				}).timestamp).to.be('2015-08-22T04:14:10+00:00');
		});

		it('handles integers that are already integers', function() {
			expect(fixVictorOpsAlert.correctTypes({ 
					incident: 1
				}).incident).to.be(1);
		});
	});
});
