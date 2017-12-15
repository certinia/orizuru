/**
 * Copyright (c) 2017, FinancialForce.com, inc
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, 
 *   are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, 
 *      this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice, 
 *      this list of conditions and the following disclaimer in the documentation 
 *      and/or other materials provided with the distribution.
 * - Neither the name of the FinancialForce.com, inc nor the names of its contributors 
 *      may be used to endorse or promote products derived from this software without 
 *      specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
 *  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES 
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL 
 *  THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, 
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 *  OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 *  OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **/

'use strict';

const
	EventEmitter = require('events'),

	Transport = require('./transport/transport'),

	ServerValidator = require('./validator/server'),
	PublisherValidator = require('./validator/publisher'),

	PROPERTY_TRANSPORT = 'transport',
	PROPERTY_TRANSPORT_CONFIG = 'transport_config',
	PROPERTY_TRANSPORT_IMPL = 'transport_impl',
	PROPERTY_VALIDATOR = 'validator',

	ERROR_EVENT = 'error_event',
	INFO_EVENT = 'info_event';

/** 
 * The Publisher for publishing messages based on Avro schemas.
 * @extends EventEmitter
 **/
class Publisher extends EventEmitter {

	/**
	 * Constructs a new 'Publisher'
	 * 
	 * @param {object} config - { transport [, transportConfig] }
	 * @param {transport} config.transport - the transport object
	 * @param {object} config.transportConfig - config for the transport object
	 * @returns {Server}
	 */
	constructor(config) {

		super();

		const me = this;

		try {

			// Validate the config
			new ServerValidator(config);

			// Define the transport
			Object.defineProperty(me, PROPERTY_TRANSPORT, { value: new Transport() });
			Object.defineProperty(me, PROPERTY_TRANSPORT_IMPL, { value: config.transport.publish });
			Object.defineProperty(me, PROPERTY_TRANSPORT_CONFIG, { value: config.transportConfig });

			// Define the publisher validator
			Object.defineProperty(me, PROPERTY_VALIDATOR, { value: new PublisherValidator() });

		} catch (err) {
			me.error(err);
			throw err;
		}

	}

	/**
	 * Publishes a message.
	 * 
	 * @example
	 * // publishes a message
	 * publisher.publish({ schema, message });
	 * @example
	 * // publishes a message
	 * publisher.publish({ schema, message, context });
	 * 
	 * @param {Object} config - The message arguments.
	 * @param {Object} config.schema - The Apache Avro schema.
	 * @param {Object} config.message - The message to send.
	 * @param {Object} config.context - The context for this message.
	 * 
	 * @returns {Promise}
	 */
	publish(config) {

		var me = this;

		// Validate the arguments.
		try {
			me[PROPERTY_VALIDATOR].validate(config);
		} catch (err) {
			me.error(err);
			throw err;
		}

		// Generate transport buffer.
		const
			schema = config.schema,
			message = config.message,
			eventName = config.schema.name;

		let buffer;

		try {
			buffer = me[PROPERTY_TRANSPORT].encode(schema, message);
		} catch (err) {

			const errors = [];

			errors.push(`Error encoding message for schema (${eventName}):`);

			schema.isValid(config.message, {
				errorHook: (path, any, type) => {
					errors.push(`invalid value (${any}) for path (${path.join()}) it should be of type (${type.typeName})`);
				}
			});

			me.error(errors.join('\n'));
			throw new Error(errors.join('\n'));

		}

		// publish buffer on transport
		return me[PROPERTY_TRANSPORT_IMPL]({ eventName, buffer, config: me[PROPERTY_TRANSPORT_CONFIG] })
			.then(result => {
				me.log(`Published ${schema.name} event.`);
				return result;
			})
			.catch(err => {
				me.error('Error publishing message on transport.');
				throw err;
			});

	}

	/**
	 * Emit an error event.
	 * @param {Object} event 
	 */
	error(event) {
		this.emit(ERROR_EVENT, event);
	}

	/**
	 * Emit a log event.
	 * @param {Object} event 
	 */
	log(event) {
		this.emit(INFO_EVENT, event);
	}

}

module.exports = Publisher;
