/*
 * Copyright (c) 2017-2019, FinancialForce.com, inc
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

/**
 * @module handler
 */

import { EventEmitter } from 'events';
import { get } from 'lodash';

import { ITransport, Options } from '..';
import { messageHandler } from './handler/messageHandler';
import { HandlerValidator } from './validator/handler';
import { HandlerFunctionValidator } from './validator/handlerFunction';

/**
 * The Handler for consuming messages in a worker dyno created by {@link Server}.
 * @extends EventEmitter
 */
export class Handler extends EventEmitter {

	/**
	 * The error event name.
	 */
	public static readonly ERROR = Symbol();

	/**
	 * The info event name.
	 */
	public static readonly INFO = Symbol();

	public readonly options: Options.IHandler;
	private readonly transport: ITransport;
	private readonly validator: HandlerFunctionValidator;

	/**
	 * Constructs a new 'Handler'.
	 */
	constructor(options: Options.IHandler) {

		super();

		this.options = options;

		try {

			// Validate the config
			new HandlerValidator(options);

			// Define the transport
			this.transport = options.transport;

			// Define the handler function validator
			this.validator = new HandlerFunctionValidator();

		} catch (err) {
			this.error(err);
			throw err;
		}

	}

	/**
	 * Initialise the handler.
	 */
	public async init() {
		await this.transport.connect();
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
	public async handle<C extends Orizuru.Context, M extends Orizuru.Message>(options: Options.IHandlerFunction<C, M>) {

		try {
			this.validator.validate(options);
		} catch (err) {
			this.error(err);
			throw err;
		}

		const eventName = get(options, 'subscribeOptions.eventName') || get(options, 'schema.name');
		const handler = messageHandler(this, options);
		const subscribeOptions = options.subscribeOptions || {
			eventName
		};

		this.info(`Installing handler for ${eventName} events.`);

		return this.transport.subscribe(handler, subscribeOptions);

	}

	/**
	 * Emit an error event.
	 * @param event - The error event.
	 */
	public error(event: any) {
		this.emit(Handler.ERROR, event);
	}

	/**
	 * Emit an info event.
	 * @param event - The info event.
	 */
	public info(event: any) {
		this.emit(Handler.INFO, event);
	}

}
