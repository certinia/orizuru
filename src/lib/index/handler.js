'use strict';
/**
 * The Handler for consuming messages in a worker dyno created by Server.
 * @module index/handler
 * @see module:index/server
 */

const
	_ = require('lodash'),

	Subscribe = require('./messaging/subscribe'),
	{ compileSchemas } = require('./shared/compileSchemas'),

	schemaMap = new WeakMap();

/** Class representing a handler. */
class Handler {

	/**
	 * Constructs a new Handler
	 * 
	 * @example
	 * // creates a handler for schemas
	 * new Handler({
	 * 	schemaNameToDefinition: {
	 * 		test: {} // an avro compliant schema (see avro schema API)
	 * 	}
	 * });
	 * 
	 * @param {object} config - { schemaNameToDefinition }
	 * 
	 * @returns {Handler}
	 */
	constructor({ schemaNameToDefinition }) {

		compileSchemas(schemaNameToDefinition);

		schemaMap[this] = schemaNameToDefinition;

	}

	/**
	 * Sets the handler function for a schema provided in the constructor
	 * 
	 * @example
	 * handler.handle({ schemaName: 'test', callback: (message) => {
	 * 	console.log(message);
	 * }})
	 * 
	 * @param {object} config - { schemaName, callback } 
	 * 
	 * @returns {Promise}
	 */
	handle({ schemaName, callback }) {

		const schema = schemaMap[this][schemaName];

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

}

module.exports = Handler;
