'use strict';

const
	Amqp = require('./amqp'),

	subscribeAction = ({ topic, handler, channel }) => {
		// Ensure the topic exists
		channel.assertQueue(topic);

		// Subscribe to the topic
		return channel.consume(topic, message => {
			return Promise.resolve()
				.then(() => {
					// Invoke the handler with the message
					return handler(message.content);
				})
				.then(
					result => channel.ack(message),
					err => channel.ack(message).then(() => {
						throw err;
					})
				);
		});
	},

	handle = ({ schemaName, handler }) => {
		// Opens a connection to the RabbitMQ server, and subscribes to the topic
		return Amqp.apply(channel => subscribeAction({ topic: schemaName, handler, channel }));
	};

module.exports = {
	handle
};
