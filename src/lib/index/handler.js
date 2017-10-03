'use strict';
/**
 * The Handler for consuming messages in a worker dyno created by Server.
 * @module index/handler
 * @see module:index/server
 */

const
	_ = require('lodash'),

	Subscribe = require('./messaging/subscribe'),
	transport = require('./messaging/transportSchema'),
	{ schemaForJson } = require('./shared/schema');

/** Class representing a handler. */
class Handler {

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

		const transportSchema = schemaForJson(transport);

		if (!_.isFunction(callback)) {
			throw new Error(`Please provide a valid callback function for schema: '${schemaName}'`);
		}

		return Subscribe.handle({
			schemaName,
			handler: ({ content }) => {

				const transportObject = transportSchema.fromBuffer(content);

				callback({ body: transportObject });
			}
		});
	}

}

module.exports = Handler;
