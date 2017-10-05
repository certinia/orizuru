'use strict';

const
	root = require('app-root-path'),

	// get the server
	{ Publisher } = require(root + '/src/lib/index'),

	// get the transport
	transport = require('@financialforcedev/nozomi-transport-rabbitmq'),

	// configure the transport
	transportConfig = {
		cloudamqpUrl: 'amqp://localhost'
	},

	// get schemas
	schemaNameToDefinition = require('./schemas');

// Publish using publisher, context is optional
new Publisher({ transport, transportConfig })
	.publish({
		eventName: 'testEvent',
		schema: schemaNameToDefinition.firstAndLastName,
		message: {
			firstName: 'testFirstName',
			lastName: 'testLastName'
		},
		context: {
			someVar: 'someValue'
		}
	});
