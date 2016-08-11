var expect = require('expect.js');
var TeamConfiguration = require('../lib/teamConfiguration');

describe.skip('Team Configuration', function() {
	describe('get team for alert', function() {
		it('returns Unknown when no team matched', function() {
			var teamConfiguration = new TeamConfiguration({
				"teams": []
			});

			expect(teamConfiguration.getTeamForAlert({
				monitoring_tool: "NewRelic",
				application_name: "RES - Booking Web"
			})).to.be('Unknown');
		});

		it('returns Unknown when the team does not have a monitoring_tool definition', function() {
			var teamConfiguration = new TeamConfiguration({
				"teams": [
					{
						"name": "Reservations",
						"NewRelic": "RES"
					}
				]
			});

			expect(teamConfiguration.getTeamForAlert({
				monitoring_tool: "ICINGA",
				application_name: "RES - Booking Web"
			})).to.be('Unknown');
		});

		it('gets team for new relic with correct product prefix', function() {
			var teamConfiguration = new TeamConfiguration({
				"teams": [
					{
						"name": "Reservations",
						"NewRelic": "RES"
					}
				]
			});

			expect(teamConfiguration.getTeamForAlert({
				monitoring_tool: "NewRelic",
				application_name: "RES - Booking Web"
			})).to.be('Reservations');
		});
	});
});
