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

import _ from 'lodash';
import { EventEmitter } from 'events';
import HandlerValidator from './validator/handler';
import ServerValidator from './validator/server';
import messageHandler from './handler/messageHandler';

/**
 * The Handler for consuming messages in a worker dyno created by Server.
 * @extends EventEmitter
 */
export default class Handler extends EventEmitter {

	/**
	 * The error event name.
	 */
	static readonly ERROR: string = 'error_event';

	/**
	 * The info event name.
	 */
	static readonly INFO: string = 'info_event';

	private readonly tranportConfig: any;
	private readonly tranportImpl: any;
	private readonly validator: HandlerValidator;

	/**
	 * Constructs a new 'Handler'.
	 */
	constructor(config: any) {

		super();

		this.info('Creating handler.');

		try {

			// Validate the config
			new ServerValidator(config);

			// Define the transport
			this.tranportConfig = config.transportConfig;
			this.tranportImpl = config.transport.subscribe;

			// Define the handler validator
			this.validator = new HandlerValidator();

		} catch (err) {
			this.error(err);
			throw err;
		}

	}

	/**
	 * Sets the handler function for a schema type.
	 *
	 * @example
	 * ```typescript
	 * 
	 * handler.handle({ schema, handler: ({ message, context }) => {
	 * 	console.log(message);
	 * 	console.log(context);
	 * }});
	 * ```
	 */
	handle(config: any) {

		try {
			this.validator.validate(config);
		} catch (err) {
			this.error(err);
			throw err;
		}

		const
			eventName = _.get(config, 'config.eventName') || _.get(config, 'schema.name'),
			handler = messageHandler(this, config),
			transportImplConfig = _.cloneDeep(this.tranportConfig);

		transportImplConfig.config = config.config || {};

		this.info(`Installing handler for ${eventName} events.`);

		return this.tranportImpl({
			eventName,
			handler,
			config: transportImplConfig
		});

	}

	/**
	 * Emit an error event.
	 * @param {Object} event - The error event.
	 */
	error(event: any) {
		this.emit(Handler.ERROR, event);
	}

	/**
	 * Emit an info event.
	 * @param {Object} event - The info event.
	 */
	info(event: any) {
		this.emit(Handler.INFO, event);
	}

}

