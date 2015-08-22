var _ = require('lodash');

var applicationNameTeamSlugRegex = /^([A-Z]+) ?\-/i;

var monitoringApplicationNameGetters = {
	'NewRelic': function(alert) {
		return alert.application_name;
	}
};

var monitoringApplicationTeamFilters = {
	'NewRelic': function(applicationName, team) {
		var teamPrefixSlugMatch = applicationName.match(applicationNameTeamSlugRegex);
		var applicationNameSlug;

		if(teamPrefixSlugMatch) {
			applicationNameSlug = teamPrefixSlugMatch[1];
		}
		else {
			applicationNameSlug = applicationName;
		}

		if(applicationNameSlug === team.NewRelic) {
			return true;
		}
	}
};

module.exports = function (config) {
	var teams = config.teams;

	return {
		getTeamForAlert: function(alert) {
			var monitoringTool = alert.monitoring_tool;

			var applicationName = monitoringApplicationNameGetters[monitoringTool](alert);

			if(!applicationName) {
				return 'Unknown';
			}

			var matchingTeam = _.filter(teams, monitoringApplicationTeamFilters[monitoringTool].bind(undefined, applicationName));

			if(!matchingTeam.length) {
				return 'Unknown';
			}

			return matchingTeam[0].name;
		}
	};
};
