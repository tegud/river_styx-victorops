var expect = require('expect.js');
var fixVictorOpsAlert = require('../lib/fixVictorOpsAlert');

describe('fixVictorOpsAlert', function() {
	describe('cleanUpStrings', function() {
		it('leaves valid strings alone', function() {
			expect(fixVictorOpsAlert.cleanUpStrings({ incident: '7781029' }).incident).to.be('7781029');
		});

		it('leaves removes redundant quote marks from beginning and end of strings', function() {
			expect(fixVictorOpsAlert.cleanUpStrings({ vo_routing_keys: 'TEST' }).vo_routing_keys).to.be('TEST');
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

	describe('prune properties', function() {
		it('corrects icinga alert', function() {
			expect(fixVictorOpsAlert.pruneProperties({
				incident: '7794976',
				ack_msg: '',
				monitoring_tool: 'ICINGA',
				_contactvo_command_url: '/nagiosCmds',
				state_start_time: '1440289067',
				vo_alert_file: '1440289187___9cd08bf7-42da-4eb6-be50-16bcb7f73fed',
				hostname: 'Booking Form Reservations Api',
				timestamp: '1440289187',
				notificationtype: 'PROBLEM',
				vo_alert_type: 'SERVICE',
				vo_alert_rcv_time: '1440289190245',
				hostalias: 'Booking Form Reservations Api',
				_contactvo_alert_url: '/nagios',
				lastservicestatechange: '1440289067',
				_contactvo_queue_dir: '/var/nagios',
				commandfile: '/var/run/icinga2/cmd/icinga2.cmd',
				entity_display_name: 'Errors',
				contactgroupname: 'VictorOps',
				message_type: 'CRITICAL',
				alert_type: 'PROBLEM',
				serviceoutput: 'Current value: 33.0, warn threshold: 1.0, crit threshold: 10.0',
				host_name: 'Booking Form Reservations Api',
				vo_uuid: 'd902f584-c263-4584-bedb-bba67b873bd5',
				entity_state: 'CRITICAL',
				statusdatafile: '/var/cache/icinga2/status.dat',
				lasthoststatechange: '1431943202',
				timet: '1440289187',
				_contactvo_status_url: '/nagiosStatus',
				_contactvo_organization_id: 'laterooms',
				ack_author: '',
				api_key: 'd76693dd-3290-4e2a-b0d0-d3f2126f7da5',
				entity_id: 'monitoringserver.domain.com/Booking Form Reservations Api/Errors',
				servicedisplayname: 'Errors',
				state_message: 'Current value: 33.0, warn threshold: 1.0, crit threshold: 10.0',
				_contactvo_monitor_name: 'monitoringserver.domain.com',
				_contactvo_protocol: 'https',
				servicedesc: 'Errors',
				longdatetime: '2015-08-23 01:19:47 +0100',
				_contactvo_contactemail: 'steve.elliot@laterooms.com',
				_contactvo_organization_key: 'd76693dd-3290-4e2a-b0d0-d3f2126f7da5',
				_contactvo_log_dir: '/var/log/victorops',
				hoststate: 'UP',
				_contactvo_ping_url: '/ping',
				message: 'PROBLEM Booking Form Reservations Api monitoringserver.domain.com/Booking Form Reservations Api/Errors CRITICAL - Current value: 33.0, warn threshold: 1.0, crit threshold: 10.0',
				_contactvo_plugin_home: '/opt/victorops/nagios_plugin',
				servicestate: 'CRITICAL',
				_contactvo_max_send_delay: '60',
				entity_is_host: 'false',
				_contactvo_alert_host: 'alert.victorops.com',
				vo_organization_id: 'laterooms',
				routing_key: 'VictorOps',
				vo_monitor_type: '1',
				summary: 'PROBLEM Booking Form Reservations Api monitoringserver.domain.com/Booking Form Reservations Api/Errors CRITICAL',
				hostdisplayname: 'Booking Form Reservations Api' 
			})).to.eql({
				incident: '7794976',
				monitoringTool: 'ICINGA',
				stateStartTime: '1440289067',
				hostname: 'Booking Form Reservations Api',
				'@timestamp': '1440289187',
				notificationType: 'PROBLEM',
				contactGroupName: 'VictorOps',
				voAlertType: 'SERVICE',
				ackAuthor: '',
				voAlertReceivedTime: '1440289190245',
				hostAlias: 'Booking Form Reservations Api',
				lastServiceStateChange: '1440289067',
				entityDisplayName: 'Errors',
				messageType: 'CRITICAL',
				alertType: 'PROBLEM',
				serviceOutput: 'Current value: 33.0, warn threshold: 1.0, crit threshold: 10.0',
				hostName: 'Booking Form Reservations Api',
				voUuid: 'd902f584-c263-4584-bedb-bba67b873bd5',
				entityState: 'CRITICAL',
				lastHostStateChange: '1431943202',
				entityId: 'monitoringserver.domain.com/Booking Form Reservations Api/Errors',
				serviceDisplayName: 'Errors',
				stateMessage: 'Current value: 33.0, warn threshold: 1.0, crit threshold: 10.0',
				icingaInstance: 'monitoringserver.domain.com',
				serviceDesc: 'Errors',
				hostState: 'UP',
				message: 'PROBLEM Booking Form Reservations Api monitoringserver.domain.com/Booking Form Reservations Api/Errors CRITICAL - Current value: 33.0, warn threshold: 1.0, crit threshold: 10.0',
				serviceState: 'CRITICAL',
				entityIsHost: 'false',
				routingKey: 'VictorOps',
				voMonitorType: '1',
				summary: 'PROBLEM Booking Form Reservations Api monitoringserver.domain.com/Booking Form Reservations Api/Errors CRITICAL',
				hostDisplayName: 'Booking Form Reservations Api'
			});
		});
	});
});
