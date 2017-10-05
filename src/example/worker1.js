'use strict';

const
	root = require('app-root-path'),
	{ Handler } = require(root + '/src/lib/index'),

	// get the transport
	transport = require('@financialforcedev/nozomi-transport-rabbitmq'),

	// configure the transport
	transportConfig = {
		cloudamqpUrl: 'amqp://localhost'
	},

	// get schemas
	schemaName = '/api/firstAndLastName',

	// create a simple callback
	callback = ({ typed, untyped }) => {
		// eslint-disable-next-line no-console
		console.log('worker 1');
		// eslint-disable-next-line no-console
		console.log(typed);
		// eslint-disable-next-line no-console
		console.log(untyped);
	};

// wire handler
new Handler({ transport, transportConfig }).handle({ schemaName, callback });
