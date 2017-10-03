'use strict';
/**
 * The Handler for consuming messages in a worker dyno created by Server.
 * @module index/handler
 * @see module:index/server
 */

const
	_ = require('lodash'),

	Subscribe = require('./messaging/subscribe'),
	{ fromTransport } = require('./shared/transport');

/** Class representing a handler. */
class Handler {

	/**
	 * Sets the handler function for a fully qualified event
	 * 
	 * @example
	 * handler.handle({ schemaName: '/api/test', callback: ({ nozomi, body }) => {
	 * 	console.log(nozomi);
	 * 	console.log(body);
	 * }})
	 * 
	 * @param {object} config - { schemaName, callback } 
	 * 
	 * @returns {Promise}
	 */
	handle({ schemaName, callback }) {

		if (!_.isFunction(callback)) {
			throw new Error(`Please provide a valid callback function for schema: '${schemaName}'`);
		}

		return Subscribe.handle({
			schemaName,
			handler: ({ content }) => callback(fromTransport(content))
		});
	}

}

module.exports = Handler;
