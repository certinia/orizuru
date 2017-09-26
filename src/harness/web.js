'use strict';

const
	// get the server
	root = require('app-root-path'),
	{ Server } = require(root + '/src/lib/index'),

	// get schemas
	schemaNameToDefinition = require('./schemas'),

	// define the endpoint ( in this case: /api/{schemaname} )
	apiEndpoint = '/api',

	// define middlewares (in order of usage)
	middlewares = [(req, res, next) => {
		req.body.auth = 'test auth token or whatever, object containing id, name, etc';
		next();
	}],

	// define port (should be an env var in production)
	port = 5555;

// listen using the schemas
// you could call 'addRoute' multiple times to add different sets of schemas on different endpoints with different middlewares, etc
// apiEndpoint defaults to '/{schemaname}', middlewares defaults to []
new Server()
	.addRoute({ schemaNameToDefinition, apiEndpoint, middlewares })
	.getServer()
	// getServer returns the express server, you could push other routes on to it (public folders, etc) at this point
	.listen(port);
