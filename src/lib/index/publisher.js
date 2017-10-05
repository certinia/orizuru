'use strict';
/**
 * The Publisher for publishing messages based on Avro schemas. 
 * Messages are consumed by Handler
 * @module index/publisher
 * @see module:index/handler
 */

const
	_ = require('lodash'),
	{ compileFromSchemaDefinition } = require('./shared/schema'),
	{ validate } = require('./shared/configValidator'),
	{ toBuffer } = require('./shared/transport'),

	privateConfig = new WeakMap();

/** Class representing a publisher. */
class Publisher {

	/**
	 * Constructs a new 'Publisher'
	 * 
	 * @param {object} config - { transport [, transportConfig] }
	 * @returns {Server}
	 */
	constructor(config) {

		// validate config
		validate(config);
		privateConfig[this] = config;

	}

	/**
	 * Publishes a message
	 * 
	 * @example
	 * // publishes a message
	 * publisher.publish({ eventName, schema, message });
	 * @example
	 * // publishes a message
	 * publisher.publish({ eventName, schema, message, context });
	 * 
	 * @param {object} config - { eventName, schema, message [, context] }
	 * 
	 * @returns {Promise}
	 */
	publish({ eventName, schema, message, context }) {

		// get config
		const config = privateConfig[this];

		let compiledSchema,
			buffer,
			result;

		// compile schema if required
		if (!_.hasIn(schema, 'toBuffer')) {
			try {
				compiledSchema = compileFromSchemaDefinition(schema);
			} catch (err) {
				return Promise.reject(new Error('Schema could not be compiled.'));
			}
		} else {
			compiledSchema = schema;
		}

		// generate transport buffer
		try {
			buffer = toBuffer(compiledSchema, message, context);
		} catch (err) {
			Promise.reject(new Error('Error encoding message for schema.'));
		}

		// publish buffer on transport
		try {
			result = config.transport.publish({ eventName, buffer, config: config.transportConfig });
		} catch (err) {
			Promise.reject(new Error('Error publishing message on transport'));
		}

		// return result of publish, wrapped in safety method to promisify non-promise values.
		return Promise.resolve(result);

	}

}

module.exports = Publisher;
