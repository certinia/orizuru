'use strict';

const
	amqp = require('amqplib');

let connection;

class Amqp {

	static apply(action) {
		const url = process.env.CLOUDAMQP_URL || 'amqp://localhost';

		return Promise.resolve()
			.then(() => {
				// Use the connection if created earlier
				// (lazy loading)
				if (connection) {
					return connection;
				}

				// Create a new RabbitMQ connection
				return amqp.connect(url)
					.then(newConnection => {
						connection = newConnection;
						return connection;
					});
			})
			.then(connection => {
				// Create a RabbitMQ channel
				return connection.createChannel();
			})
			.then(channel => {
				// Invoke the action callback on the
				// new channel 
				return action(channel);
			});
	}

}

module.exports = Amqp;
