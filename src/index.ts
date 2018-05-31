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

/**
 * The Index file for project.
 * Returns the Server, Handler and Publisher classes.
 * @module index
 * @see Server
 * @see Handler
 * @see Publisher
 */

import { Type } from 'avsc/types';
import { Request, Response } from 'express';

import { default as Server } from './index/server';

/**
 * Handler
 */
export { default as Handler } from './index/handler';

/**
 * Publisher
 */
export { default as Publisher } from './index/publisher';

/**
 * Server
 */
export { default as Server } from './index/server';

export interface IOrizuruRequest extends Request {
	orizuru: any;
}

export interface IOrizuruResponse extends Response {
	orizuru: any;
}

export interface ITransport {

	/**
	 * Connects to the transport layer.
	 */
	connect: (options: Options.Transport.IConnect) => Promise<boolean>;

	/**
	 * Publishes a message.
	 */
	publish: (buffer: Buffer, options: Options.Transport.IPublish) => Promise<boolean>;

	/**
	 * Subscribes to a message queue.
	 */
	subscribe: (handler: (content: Buffer) => Promise<void>, options: Options.Transport.ISubscribe) => Promise<void>;

	/**
	 * Closes the transport gracefully.
	 */
	close: () => Promise<any>;

}

export interface IOrizuruMessage {
	message: any;
	context?: any;
}

export declare namespace Options {

	export interface IServer {
		transportConfig: Options.Transport.IConnect;
		transport: ITransport;
	}

	export interface IPublisher {
		message: IOrizuruMessage;
		schema: Type;
		publishOptions: Options.Transport.IPublish;
	}

	export interface IHandler {
		schema: Type;
		handler: (message: IOrizuruMessage) => Promise<any>;
		subscribeOptions: Options.Transport.ISubscribe;
	}

	export namespace Route {

		export interface IRaw {
			method: string;
			endpoint: string;
			middleware: any;
			pathMapper: (schemaNamespace: string) => string;
			responseWriter: (server: Server) => (error: Error | undefined, request: IOrizuruRequest, response: IOrizuruResponse) => void;
			schema: any;
			publishOptions?: Options.Transport.IPublish;
		}

		export interface IValidated extends IRaw {
			schema: Type;
		}

	}

	export namespace Transport {

		export interface IConnect {
			url: string;
		}

		export interface IPublish {
			eventName?: string;
			message?: any;
			schema?: Type;
		}

		export interface ISubscribe {
			eventName: string;
		}

	}

}
