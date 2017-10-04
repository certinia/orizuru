'use strict';

const
	root = require('app-root-path'),
	{ Handler } = require(root + '/src/lib/index'),

	// get schemas
	schemaName = '/api/ageAndDob',

	// create a simple callback
	callback = ({ body, nozomi }) => {
		// eslint-disable-next-line no-console
		console.log('worker 1');
		// eslint-disable-next-line no-console
		console.log(body);
		// eslint-disable-next-line no-console
		console.log(nozomi);
	};

// wire handler
new Handler().handle({ schemaName, callback });
