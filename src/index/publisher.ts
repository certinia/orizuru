/**
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

import { EventEmitter } from 'events';

import { AvroSchema, ITransport, Options } from '..';
import { Transport } from './transport/transport';
import { MessageValidator } from './validator/message';
import { PublisherValidator } from './validator/publisher';
import { PublishFunctionValidator, ValidatedPublishFunctionOptions } from './validator/publishFunction';

/**
 * The Publisher for publishing messages based on Avro schemas.
 * @extends EventEmitter
 */
export class Publisher extends EventEmitter {

	/**
	 * The error event name.
	 */
	public static readonly ERROR = Symbol();

	/**
	 * The info event name.
	 */
	public static readonly INFO = Symbol();

	public readonly options: Options.IPublisher;
	private readonly transport: Transport;
	private readonly transportImpl: ITransport;
	private readonly validator: PublishFunctionValidator;
	private readonly messageValidator: MessageValidator;

	/**
	 * Constructs a new 'Publisher'.
	 */
	constructor(options: Options.IPublisher) {

		super();

		this.options = options;

		try {

			// Validate the config
			new PublisherValidator(options);

			// Define the transport
			this.transport = new Transport();
			this.transportImpl = options.transport;

			// Define the publish function validator
			this.validator = new PublishFunctionValidator();

			// Define the message validator
			this.messageValidator = new MessageValidator();

		} catch (err) {
			this.error(err);
			throw err;
		}

	}

	/**
	 * Initialise the publisher.
	 */
	public async init() {
		await this.transportImpl.connect();
	}

	/**
	 * Publishes a message.
	 *
	 * @example
	 * // publishes a message
	 * publisher.publish({ schema, message });
	 */
	public async publish<C extends Orizuru.Context, M extends Orizuru.Message>(options: Options.IPublishFunction<C, M>) {

		let validatedOptions: ValidatedPublishFunctionOptions<C, M>;

		// Validate the arguments.
		try {
			validatedOptions = this.validator.validate(options);
		} catch (err) {
			this.error(err);
			throw err;
		}

		// Validate the message
		try {
			this.messageValidator.validate(validatedOptions.schema, validatedOptions.message.message);
		} catch (err) {
			this.error(err);
			throw err;
		}

		// Generate transport buffer.
		const schema = options.schema as AvroSchema;
		const message = options.message;
		const eventName = schema.name as string;

		const publishOptions = options.publishOptions || {
			eventName
		};
		publishOptions.context = options.message.context;
		publishOptions.message = options.message.message;
		publishOptions.schema = schema;

		let buffer: Buffer;

		try {
			buffer = this.transport.encode(schema, message);
		} catch (error) {
			const errorMessage = `Error encoding message for schema (${schema.name}): ${error.message}`;
			this.error(errorMessage);
			throw new Error(errorMessage);
		}

		// publish buffer on transport
		return this.transportImpl.publish(buffer, publishOptions)
			.then((result) => {
				this.info(`Published ${schema.name} event.`);
				return result;
			})
			.catch((err) => {
				this.error('Error publishing message on transport.');
				throw err;
			});

	}

	/**
	 * Emit an error event.
	 * @param event - The error event.
	 */
	public error(event: any) {
		this.emit(Publisher.ERROR, event);
	}

	/**
	 * Emit an info event.
	 * @param event - The info event.
	 */
	public info(event: any) {
		this.emit(Publisher.INFO, event);
	}

}
