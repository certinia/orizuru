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
	 * @param {transport} config.transport - the transport object
	 * @param {object} config.transportConfig - config for the transport object
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
	 * @param {object} config.eventName - event name (non empty string)
	 * @param {object} config.schema - schema (compiled or uncompiled schema object)
	 * @param {object} config.message - message (must match schema)
	 * @param {object} config.context - untyped context (optional)
	 * 
	 * @returns {Promise}
	 */
	publish({ eventName, schema, message, context }) {

		// get config
		const config = privateConfig[this];

		// check event name
		if (!_.isString(eventName) || _.size(eventName) < 1) {
			return Promise.reject(new Error('Event name must be an non empty string.'));
		}

		let compiledSchema,
			buffer;

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
			return Promise.reject(new Error('Error encoding message for schema.'));
		}

		// publish buffer on transport
		return Promise.resolve(config.transport.publish({ eventName, buffer, config: config.transportConfig }))
			.catch(() => {
				throw new Error('Error publishing message on transport.');
			});

	}

}

module.exports = Publisher;
