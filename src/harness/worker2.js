'use strict';

const
	root = require('app-root-path'),
	_ = require('lodash'),
	{ Handler } = require(root + '/src/lib/index'),

	// get schemas
	schemaName = 'ageAndDob',
	schemaNameToDefinition = _.pick(require('./schemas'), schemaName),

	// create a simple callback
	callback = ({ body }) => {
		console.log('worker 2');
		console.log(body);
	},

	// create a handler with the schemas we want to handle. You could _.pick to be specific
	handler = new Handler({ schemaNameToDefinition });

// wire handler
handler.handle({ schemaName, callback });
