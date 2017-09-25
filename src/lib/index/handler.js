'use strict';

const
	_ = require('lodash'),

	Subscribe = require('./messaging/subscribe'),
	{ compileSchemas } = require('./shared/compileSchemas');

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
