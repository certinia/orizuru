'use strict';
/**
 * The Handler for consuming messages in a worker dyno created by Server.
 * @module index/handler
 * @see module:index/server
 */

const
	_ = require('lodash'),

	{ validate } = require('./shared/configValidator'),
	{ fromBuffer } = require('./shared/transport'),

	privateConfig = new WeakMap();

/** Class representing a handler. */
class Handler {

	/**
	 * Constructs a new 'Handler'
	 * 
	 * @param {object} config - { transport [, transportConfig] }
	 * @returns {Handler}
	 */
	constructor(config) {

		// validate config
		validate(config);
		privateConfig[this] = config;

	}

	/**
	 * Sets the handler function for a fully qualified event
	 * 
	 * @example
	 * handler.handle({ schemaName: '/api/test', callback: ({ message, context }) => {
	 * 	console.log(message);
	 * 	console.log(context);
	 * }})
	 * 
	 * @param {object} config - { schemaName, callback } 
	 * 
	 * @returns {Promise}
	 */
	handle({ schemaName, callback }) {

		const config = privateConfig[this];

		if (!_.isFunction(callback)) {
			throw new Error(`Please provide a valid callback function for schema: '${schemaName}'`);
		}

		return config.transport.subscribe({
			eventName: schemaName,
			handler: (content) => callback(fromBuffer(content)),
			config: config.transportConfig
		});
	}

}

module.exports = Handler;
