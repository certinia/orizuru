'use strict';

const
	_ = require('lodash'),
	avro = require('avsc'),
	express = require('express'),
	bodyParser = require('body-parser'),
	helmet = require('helmet'),

	Publish = require('./server/publish'),

	API = '/api/:schemaName',

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

	},

	compileSchemas = schemaNameToDefinition => {
		if (!_.isObject(schemaNameToDefinition)) {
			throw new Error('Server init argument must be an object of: schemaName -> avroSchema.');
		} else {
			_.each(schemaNameToDefinition, (value, key) => {
				try {
					schemaNameToDefinition[key] = avro.Type.forSchema(value);
				} catch (err) {
					throw new Error(`Schema name: '${key}' schema could not be compiled.`);
				}
			});
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
