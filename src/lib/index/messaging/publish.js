'use strict';

const
	Amqp = require('./amqp'),

	send = ({ schemaName, buffer }) => {
		return Amqp.apply(channel => channel.sendToQueue(schemaName, buffer));
	};

module.exports = {
	send
};
