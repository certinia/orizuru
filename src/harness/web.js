'use strict';

const
	root = require('app-root-path'),
	{ Server } = require(root + '/src/lib/index'),

	// get schemas
	schemaNameToDefinition = require('./schemas'),

	// define port (should be an env var in production)
	port = 5555;

// listen using the schemas, endpoints are like http://localhost:5555/api/{schemaname}
new Server({ schemaNameToDefinition }).listen({ port });
