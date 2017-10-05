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
	 * Sets the handler function for a fully qualified event
	 * 
	 * @example
	 * handler.handle({ eventName: '/api/test', callback: ({ message, context }) => {
	 * 	console.log(message);
	 * 	console.log(context);
	 * }})
	 * 
	 * @param {object} config - { eventName, callback } 
	 * @param {object} config.eventName - the event name to listen to ('/schemaName' for server with no API endpoint specified)
	 * @param {object} config.callback - the callback (called with { message, context })
	 * 
	 * @returns {Promise}
	 */
	handle({ eventName, callback }) {

		const config = privateConfig[this];

		if (!_.isFunction(callback)) {
			throw new Error(`Please provide a valid callback function for event: '${eventName}'`);
		}

		return config.transport.subscribe({
			eventName,
			handler: (content) => callback(fromBuffer(content)),
			config: config.transportConfig
		});
	}

}

module.exports = Handler;
