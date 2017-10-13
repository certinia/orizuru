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
 * The Handler for consuming messages in a worker dyno created by Server.
 * @module index/handler
 * @see module:index/server
 */

const
	_ = require('lodash'),
	EventEmitter = require('events'),

	{ validate } = require('./shared/configValidator'),
	{ fromBuffer } = require('./shared/transport'),
	{ catchEmitThrow, catchEmitReject } = require('./shared/catchEmitThrow'),

	privateConfig = new WeakMap(),

	ERROR_EVENT = 'error_event',
	INFO_EVENT = 'info_event',

	emitter = new EventEmitter();

/** 
 * Class representing a handler. 
 * 
 * @property {EventEmitter} emitter
 * @property {string} emitter.ERROR - the error event name
 * @property {string} emitter.INFO - the info event name
 **/
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
		catchEmitThrow(() => validate(config), ERROR_EVENT, emitter);
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
	 * @param {object} config.callback - the callback (called with { message, context }), this callback must handle error_EVENTs and should only ever return a promise which resolves or undefined 
	 * 
	 * @returns {Promise}
	 */
	handle({ eventName, callback }) {

		const config = privateConfig[this];

		// check event name
		if (!_.isString(eventName) || _.size(eventName) < 1) {
			return catchEmitReject('Event name must be an non empty string.', ERROR_EVENT, emitter);
		}

		// check callback
		if (!_.isFunction(callback)) {
			return catchEmitReject(`Please provide a valid callback function for event: '${eventName}'`, ERROR_EVENT, emitter);
		}

		return catchEmitReject(config.transport.subscribe({
			eventName,
			handler: content => {
				catchEmitThrow(() => {
					const decodedContent = fromBuffer(content);
					emitter.emit(INFO_EVENT, `Handler received ${eventName} event.`);
					callback(decodedContent);
				}, ERROR_EVENT, emitter);
			},
			config: config.transportConfig
		}), ERROR_EVENT, emitter);
	}

}

Handler.emitter = emitter;
emitter.ERROR = ERROR_EVENT;
emitter.INFO = INFO_EVENT;

module.exports = Handler;
