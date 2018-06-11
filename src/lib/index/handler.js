/**
 * Copyright (c) 2017-2018, FinancialForce.com, inc
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
	_ = require('lodash'),
	EventEmitter = require('events'),

	HandlerValidator = require('./validator/handler'),
	ServerValidator = require('./validator/server'),
	Transport = require('./transport/transport'),

	messageHandler = require('./handler/messageHandler'),

	PROPERTY_TRANSPORT = 'transport',
	PROPERTY_TRANSPORT_CONFIG = 'transport_config',
	PROPERTY_TRANSPORT_IMPL = 'transport_impl',
	PROPERTY_VALIDATOR = 'validator',

	ERROR_EVENT = 'error_event',
	INFO_EVENT = 'info_event';

/**
 * The Handler for consuming messages in a worker dyno created by Server.
 * @extends EventEmitter
 */
class Handler extends EventEmitter {

	/**
	 * Constructs a new 'Handler'.
	 *
	 * @param {Object} config - The handler configuration.
	 * @param {transport} config.transport - The transport object.
	 * @param {Object} config.transportConfig - The configuration for the transport object.
	 */
	constructor(config) {

		super();

		const me = this;
		me.info('Creating handler.');

		try {

			// Validate the config
			new ServerValidator(config);

			// Define the transport
			Object.defineProperty(me, PROPERTY_TRANSPORT, { value: new Transport() });
			Object.defineProperty(me, PROPERTY_TRANSPORT_IMPL, { value: config.transport.subscribe });
			Object.defineProperty(me, PROPERTY_TRANSPORT_CONFIG, { value: config.transportConfig });

			// Define the handler validator
			Object.defineProperty(me, PROPERTY_VALIDATOR, { value: new HandlerValidator() });

		} catch (err) {
			me.error(err);
			throw err;
		}

	}

	/**
	 * Sets the handler function for a schema type.
	 *
	 * @example
	 * handler.handle({ schema, handler: ({ message, context }) => {
	 * 	console.log(message);
	 * 	console.log(context);
	 * }})
	 *
	 * @param {Object} config - The handler configuration.
	 * @param {Object} config.schema - Schema (compiled or uncompiled Avro schema object).
	 * @param {Object} config.handler - The handler (called with { message, context }), this callback must handle error_EVENTs and should only ever return a promise which resolves or undefined.
	 * @returns {Promise} A promise.
	 */
	handle(config) {

		var me = this;

		try {
			me[PROPERTY_VALIDATOR].validate(config);
		} catch (err) {
			me.error(err);
			throw err;
		}

		const
			eventName = _.get(config, 'schema.name'),
			handler = messageHandler(me, config);

		me.info(`Installing handler for ${eventName} events.`);

		return me[PROPERTY_TRANSPORT_IMPL]({
			eventName,
			handler,
			config: me[PROPERTY_TRANSPORT_CONFIG]
		});

	}

	/**
	 * Emit an error event.
	 * @param {Object} event - The error event.
	 */
	error(event) {
		this.emit(ERROR_EVENT, event);
	}

	/**
	 * Emit an info event.
	 * @param {Object} event - The info event.
	 */
	info(event) {
		this.emit(INFO_EVENT, event);
	}

}

/**
 * The error event name.
 */
Handler.ERROR = ERROR_EVENT;

/**
 * The info event name.
 */
Handler.INFO = INFO_EVENT;

module.exports = Handler;
