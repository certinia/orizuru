'use strict';

const
	_ = require('lodash'),
	avro = require('avsc'),

	Subscribe = require('./messaging/subscribe'),

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

		this.schemas = schemaNameToDefinition;

	}

	handle({ schemaName, callback }) {

		const schema = this.schemas[schemaName];

		if (!schema) {
			throw new Error(`Schema name: '${schemaName}' not found.`);
		}

		if (!_.isFunction(callback)) {
			throw new Error(`Please provide a valid callback function for schema: '${schemaName}'`);
		}

		return Subscribe.handle({
			schemaName,
			handler: ({ content }) => {
				callback({ body: schema.fromBuffer(content) });
			}
		});
	}

};
