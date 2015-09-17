module.exports = function() {
	var esConfig = {
		host: 'logs.laterooms.com',
		port: 9200,
		index: 'releases-[YYYY.MM]'
	};

	return {
		upsert: require('./upsert').bind(undefined, esConfig),
		getDocumentIdFromIncidentName: require('./getDocumentIdFromIncidentName').bind(undefined, esConfig)
	};
}
