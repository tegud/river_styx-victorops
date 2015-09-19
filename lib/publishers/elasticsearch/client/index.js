var _ = require('lodash');

var defaults = {
	port: 9200,
	index: 'releases-[YYYY.MM]'
};

var logger = require('../../../logger').forModule('Elasticsearch Client');

module.exports = function(esConfig) {
	logger.logInfo('Elasticsearch Client configured', { options: esConfig });

	_.defaults(esConfig, defaults);

	return {
		upsert: require('./upsert').bind(undefined, esConfig),
		getDocumentIdFromIncidentName: require('./getDocumentIdFromIncidentName').bind(undefined, esConfig)
	};
}
