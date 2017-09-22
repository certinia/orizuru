'use strict';

const
	_ = require('lodash'),
	avro = require('avsc'),
	express = require('express'),
	bodyParser = require('body-parser'),
	helmet = require('helmet'),

	publish = require('./server/publish'),

	API = '/api/:schemaName',

	api = schemaNameToDefinition => (request, response) => {

		const
			schemaName = request.params.schemaName,
			schema = schemaNameToDefinition[schemaName],
			body = request.body;

		if (schema && body) {
			//TODO check schema compliance
			publish.send({ schema, body });
		} else {
			response.sendStatus(400);
		}

	},

	compileSchemas = schemaNameToDefinition => {
		if (!_.isObject(schemaNameToDefinition)) {
			throw new Error('Server init argument must be an object of: schemaName -> avroSchema.');
		} else {
			_.each(schemaNameToDefinition, (value, key) => {
				try {
					avro.Type.forSchema(value);
					schemaNameToDefinition[key] = value;
				} catch (err) {
					throw new Error(`Schema name: ${key} schema could not be compiled.`);
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
		server.use(API, api(schemaNameToDefinition));

	}

	listen({ port }) {

		// start server
		this.server.listen(port);

	}

};
