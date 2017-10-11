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
/**
 * The Publisher for publishing messages based on Avro schemas. 
 * Messages are consumed by Handler
 * @module index/publisher
 * @see module:index/handler
 */

const
	_ = require('lodash'),

	EventEmitter = require('events'),
	{ compileFromSchemaDefinition } = require('./shared/schema'),
	{ validate } = require('./shared/configValidator'),
	{ toBuffer } = require('./shared/transport'),

	{ catchEmitThrow, catchEmitReject } = require('./shared/catchEmitThrow'),

	privateConfig = new WeakMap(),

	ERROR_EVENT = 'error_event',

	emitter = new EventEmitter();

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
		catchEmitThrow(() => validate(config), ERROR_EVENT, emitter);
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
			return catchEmitReject('Event name must be an non empty string.', ERROR_EVENT, emitter);
		}

		let compiledSchema,
			buffer;

		// compile schema if required
		if (!_.hasIn(schema, 'toBuffer')) {
			try {
				compiledSchema = compileFromSchemaDefinition(schema);
			} catch (err) {
				return catchEmitReject('Schema could not be compiled.', ERROR_EVENT, emitter);
			}
		} else {
			compiledSchema = schema;
		}

		// generate transport buffer
		try {
			buffer = toBuffer(compiledSchema, message, context);
		} catch (err) {
			return catchEmitReject('Error encoding message for schema: ' + err.message, ERROR_EVENT, emitter);
		}

		// publish buffer on transport
		return catchEmitReject(Promise.resolve(config.transport.publish({ eventName, buffer, config: config.transportConfig }))
			.catch(() => {
				throw new Error('Error publishing message on transport.');
			}), ERROR_EVENT, emitter);

	}

}

Publisher.emitter = emitter;

module.exports = Publisher;
