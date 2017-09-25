'use strict';

const
	root = require('app-root-path'),
	{ Handler } = require(root + '/src/lib/index'),

	// get schemas
	schemaNameToDefinition = require('./schemas'),

	// create a simple callback
	callback = ({ body }) => {
		console.log(body);
	},

	// create a handler with the schemas we want to handle. You could _.pick to be specific
	handler = new Handler({ schemaNameToDefinition });

// you could distribute these handlers across different dyno types if you wanted
handler.handle({ schemaName: 'firstAndLastName', callback });
handler.handle({ schemaName: 'ageAndDob', callback });
