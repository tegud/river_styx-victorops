const moment = require('moment');

function correctTimestampToMilliseconds(timestamp) {
	if(timestamp.toString().length < 13) {
		return timestamp * 1000;
	}

	return timestamp;
}

function convertToUtcFormattedDate(timestamp) {
	return moment(timestamp).utc().format();
}

function processDateTimeFieldOnAlert(alert, property) {
	const propertyParts = property.split('.');
	const objectParts = propertyParts.slice(0, propertyParts.length - 1);
	const propertyName = propertyParts[propertyParts.length - 1];

	let currentObject = alert;

	while(objectParts.length) {
		const currentPart = objectParts.shift();
		currentObject = currentObject[currentPart];
	}

	if(!currentObject) {
		return alert;
	}

	if(!currentObject[propertyName]) {
		delete currentObject[propertyName];
		return alert;
	}

	currentObject[propertyName] = convertToUtcFormattedDate(correctTimestampToMilliseconds(currentObject[propertyName]));

	return alert;
}

function setTeamOnAlert(teams, alert) {
	alert.team = teams.getTeamForAlert(alert);
	return alert;
}

function setDateTimeFieldsOnAlert(alert) {
	return [
		'alert.receiveTime',
		'alert.timestamp',
		'state.ack.timestamp',
		'state.timestamp',
		'state.lastTimestamp'
	].reduce((alert, property) => processDateTimeFieldOnAlert(alert, property), alert);
}

function setStartsAndDurationsOnAlert(alert) {
	alert.startedAt = alert.state.timestamp;

	if((alert.state.currentAlertPhase === 'ACKED' || alert.state.currentAlertPhase === 'RESOLVED') && alert.state.ack) {
		alert.acknowledgedBy = alert.state.ack.user;
		alert.acknowledgedAt = alert.state.ack.timestamp;
		alert.timeToAcknowledgement = moment(alert.state.ack.timestamp).diff(alert.state.timestamp, 'ms');
	}

	if(alert.state.currentAlertPhase === 'RESOLVED') {
		alert.resolvedAt = alert.state.lastTimestamp;
		alert.timeToResolution = moment(alert.state.lastTimestamp).diff(alert.state.timestamp, 'ms');
	}

	return alert;
}

module.exports = (teams, victoropsAlert) => {
    const mappers = [
        setTeamOnAlert.bind(undefined, teams),
        setDateTimeFieldsOnAlert,
        setStartsAndDurationsOnAlert
    ];

	return mappers.reduce((alert, mapper) => mapper(alert), victoropsAlert);
};
