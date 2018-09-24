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

import { Type } from 'avsc';
import { Request, RequestHandler, Response } from 'express';

import { Server } from './index/server';

/**
 * Handler
 */
export { Handler } from './index/handler';

/**
 * Publisher
 */
export { Publisher } from './index/publisher';

/**
 * Server
 */
export { Server } from './index/server';

export { json, urlencoded, Request, Response, NextFunction, static } from 'express';

declare global {

	namespace Express {

		interface Request {
			orizuru?: Orizuru.Context;
		}

	}

	namespace Orizuru {

		// These open interfaces may be extended in an application-specific manner via declaration merging.
		interface IHandler { }

		interface IPublisher { }

		interface IServer { }

		interface Context { }

		interface IHandlerFunction { }

		interface IHandlerResponse { }

		interface IPublishFunction { }

		// These open interfaces may be extended in an application-specific manner via declaration merging.
		namespace Transport {

			interface IConnect { }

			interface IPublish { }

			interface ISubscribe { }
		}

	}

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
	subscribe: (handler: (content: Buffer) => Promise<void | Orizuru.IHandlerResponse>, options: Options.Transport.ISubscribe) => Promise<void>;

	/**
	 * Closes the transport gracefully.
	 */
	close: () => Promise<any>;

}

export interface IOrizuruMessage {
	message: any;
	context?: any;
}

export type HandlerFunction = (message: IOrizuruMessage) => Promise<void | Orizuru.IHandlerResponse>;

export type ResponseWriterFunction = (server: Server) => (error: Error | undefined, request: Request, response: Response) => void;

export declare namespace Options {

	export interface IHandler extends Orizuru.IHandler {
		transportConfig: Options.Transport.IConnect;
		transport: ITransport;
	}

	export interface IPublisher extends Orizuru.IPublisher {
		transportConfig: Options.Transport.IConnect;
		transport: ITransport;
	}

	export interface IServer extends Orizuru.IServer {
		transportConfig: Options.Transport.IConnect;
		transport: ITransport;
	}

	export interface IPublishFunction extends Orizuru.IPublishFunction {
		message: IOrizuruMessage;
		schema: string | object | Type;
		publishOptions?: Options.Transport.IPublish;
	}

	export interface IHandlerFunction extends Orizuru.IHandlerFunction {
		schema: string | object | Type;
		handler: HandlerFunction;
		subscribeOptions?: Options.Transport.ISubscribe;
	}

	export namespace Route {

		export interface IRaw {
			endpoint?: string;
			method?: string;
			middleware?: RequestHandler[];
			pathMapper?: (schemaNamespace: string) => string;
			publishOptions?: Options.Transport.IPublish;
			responseWriter?: ResponseWriterFunction;
			schema: string | object | Type;
		}

		export interface IValidated {
			endpoint: string;
			method: string;
			middleware: RequestHandler[];
			pathMapper: (schemaNamespace: string) => string;
			publishOptions?: Options.Transport.IPublish;
			responseWriter: ResponseWriterFunction;
			schema: Type;
		}

	}

	export namespace Transport {

		export interface IConnect extends Orizuru.Transport.IConnect {
			url: string;
		}

		export interface IPublish extends Orizuru.Transport.IPublish {
			eventName?: string;
			message?: any;
			schema?: Type;
		}

		export interface ISubscribe extends Orizuru.Transport.ISubscribe {
			eventName: string;
		}

	}

}
