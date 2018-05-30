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
 */

import { EventEmitter } from 'events';
import _ from 'lodash';
import { Options } from '..';
import messageHandler from './handler/messageHandler';
import HandlerValidator from './validator/handler';
import ServerValidator from './validator/server';

/**
 * The Handler for consuming messages in a worker dyno created by {@link Server}.
 * @extends EventEmitter
 */
export default class Handler extends EventEmitter {

	/**
	 * The error event name.
	 */
	public static readonly ERROR: string = 'error_event';

	/**
	 * The info event name.
	 */
	public static readonly INFO: string = 'info_event';

	private readonly tranportConfig: Options.Transport.IConfig;
	private readonly tranportImpl: (options: Options.Transport.ISubscribe) => Promise<any>;
	private readonly validator: HandlerValidator;

	/**
	 * Constructs a new 'Handler'.
	 */
	constructor(options: Options.IServer) {

		super();

		this.info('Creating handler.');

		try {

			// Validate the config
			new ServerValidator(options);

			// Define the transport
			this.tranportConfig = options.transportConfig;
			this.tranportImpl = options.transport.subscribe;

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
	public handle(options: Options.IHandler) {

		try {
			this.validator.validate(options);
		} catch (err) {
			this.error(err);
			throw err;
		}

		const eventName = _.get(options, 'config.eventName') || _.get(options, 'schema.name');
		const handler = messageHandler(this, options);
		const transportImplConfig = _.cloneDeep(this.tranportConfig);

		transportImplConfig.config = options.config || {};

		this.info(`Installing handler for ${eventName} events.`);

		return this.tranportImpl({
			config: transportImplConfig,
			eventName,
			handler
		});

	}

	/**
	 * Emit an error event.
	 * @param {Object} event - The error event.
	 */
	public error(event: any) {
		this.emit(Handler.ERROR, event);
	}

	/**
	 * Emit an info event.
	 * @param {Object} event - The info event.
	 */
	public info(event: any) {
		this.emit(Handler.INFO, event);
	}

}
