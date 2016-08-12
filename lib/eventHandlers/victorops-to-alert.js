const _ = require('lodash');
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
	return _.merge(alert, { team: teams.getTeamForAlert(alert) });
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

function setStartsAt(alert) {
	return _.merge(alert, {
		startedAt: alert.state.timestamp
	});
}

function setAcknowledged(alert) {
	if(['ACKED', 'RESOLVED'].includes(alert.state.currentAlertPhase) && alert.state.ack) {
		return _.merge(alert, {
			acknowledged: true,
			acknowledgedBy: alert.state.ack.user,
			acknowledgedAt: alert.state.ack.timestamp,
			timeToAcknowledgement: moment(alert.state.ack.timestamp).diff(alert.state.timestamp, 'ms')
		});
	}

	alert.acknowledged = false;

	return alert;
}

function setResolved(alert) {
	if(alert.state.currentAlertPhase === 'RESOLVED') {
		return _.merge(alert, {
			resolved: true,
			resolvedAt: alert.state.lastTimestamp,
			timeToResolution: moment(alert.state.lastTimestamp).diff(alert.state.timestamp, 'ms')
		});
	}

	alert.resolved = false;

	return alert;
}

module.exports = (teams, victoropsAlert) => {
    const mappers = [
        setTeamOnAlert.bind(undefined, teams),
        setDateTimeFieldsOnAlert,
        setStartsAt,
		setAcknowledged,
		setResolved
    ];

	return mappers.reduce((alert, mapper) => mapper(alert), victoropsAlert);
};
