'use strict';

const
	express = require('express'),
	bodyParser = require('body-parser'),
	helmet = require('helmet'),

	Publish = require('./messaging/publish'),

	API = '/api/:schemaName',

	{ compileSchemas } = require('./shared/compileSchemas'),

	api = schemaNameToDefinition => (request, response) => {

		const
			schemaName = request.params.schemaName,
			schema = schemaNameToDefinition[schemaName],
			body = request.body;

		if (!schema) {
			response.status(400).send(`No schema for '${schemaName}' found.`);
		} else {

			try {
				const buffer = schema.toBuffer(body);

				Publish
					.send({ schemaName, buffer })
					.then(() => response.status(200).send('Ok.'))
					.catch(() => response.status(400).send(`Error propogating event for '${schemaName}'.`));

			} catch (err) {
				response.status(400).send(`Error encoding post body for schema: '${schemaName}'.`);
			}

		}

	};

module.exports = class {

	constructor({ schemaNameToDefinition }) {

		compileSchemas(schemaNameToDefinition);

		this.server = express();

		const server = this.server;

		// body parser
		server.use(bodyParser.json());

		// Header security
		server.use(helmet());

		// api wiring
		server.post(API, api(schemaNameToDefinition));

	}

	listen({ port }) {

		// start server
		this.server.listen(port);

	}

};
