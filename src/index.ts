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
import http from 'http';

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

export { json, urlencoded, Request, Response, NextFunction, static as addStaticRoute } from 'express';

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

			interface IPublish { }

			interface ISubscribe { }
		}

	}

}

/**
 * An Apache Avro Schema
 */
export interface AvroSchema extends Type {

	/**
	 * The name of the Apache Avro schema.
	 * This should always be set.
	 */
	readonly name: string;

}

export interface ITransport {

	/**
	 * Connects to the transport layer.
	 */
	connect: () => Promise<void>;

	/**
	 * Publishes a message.
	 */
	publish: (buffer: Buffer, options: Orizuru.Transport.IPublish) => Promise<boolean>;

	/**
	 * Subscribes to a message queue.
	 */
	subscribe: (handler: (content: Buffer) => Promise<void | Orizuru.IHandlerResponse>, options: Orizuru.Transport.ISubscribe) => Promise<void>;

	/**
	 * Closes the transport gracefully.
	 */
	close: () => Promise<void>;

}

/**
 * The Orizuru message sent via the transport layer.
 */
export interface IOrizuruMessage<C extends Orizuru.Context, M> {

	/**
	 * The context for the message.
	 */
	context: C;

	/**
	 * The message.
	 */
	message: M;
}

/**
 * The server implementation.
 * By default, we use [Express](https://expressjs.com/).
 * This allows us to easily set up a mock implementation for testing.
 */
export interface IServerImpl {
	(req: Request | http.IncomingMessage, res: Response | http.ServerResponse): void;
	listen(port: number, callback?: (app: this) => void): http.Server;
	set(setting: string, val: any): this;
	use(path: string, ...handlers: RequestHandler[]): this;
}

export type HandlerFunction<C extends Orizuru.Context, M> = (message: IOrizuruMessage<C, M>) => Promise<void | Orizuru.IHandlerResponse>;

export type ResponseWriterFunction = (server: Server) => (error: Error | undefined, request: Request, response: Response) => void;

export declare namespace Options {

	export interface IHandler extends Orizuru.IHandler {
		transport: ITransport;
	}

	export interface IPublisher extends Orizuru.IPublisher {
		transport: ITransport;
	}

	export interface IServer extends Orizuru.IServer {
		port: number;
		server?: IServerImpl;
		transport: ITransport;
	}

	export interface IPublishFunction<C extends Orizuru.Context, M> extends Orizuru.IPublishFunction {
		message: IOrizuruMessage<C, M>;
		schema: string | object | Type;
		publishOptions?: Options.Transport.IPublish;
	}

	export interface IHandlerFunction<C extends Orizuru.Context, M> extends Orizuru.IHandlerFunction {
		schema: string | object | Type;
		handler: HandlerFunction<C, M>;
		subscribeOptions?: Options.Transport.ISubscribe;
	}

	export namespace Route {

		export interface IRaw {

			/**
			 * The base endpoint for this route.
			 *
			 * By default, the endpoint is constructed using the namepace and name of the Avro schema.
			 * This parameter adds a prefix to that endpoint.
			 */
			endpoint?: string;

			/**
			 * The HTTP method for this route.
			 */
			method?: string;

			/**
			 * The middlewares for this route.
			 */
			middleware?: RequestHandler[];
			pathMapper?: (schemaNamespace: string) => string;
			publishOptions?: Options.Transport.IPublish;

			/**
			 * Function to determine how the response is written to the server.
			 */
			responseWriter?: ResponseWriterFunction;

			/**
			 * The Apache Avro schema that messages for this route should be validated against.
			 */
			schema: string | object | Type;

			/**
			 * Determines whether this process is dealt with synchronously.
			 * By default, false.
			 */
			synchronous?: boolean;

		}

	}

	export namespace Transport {

		export interface IPublish extends Orizuru.Transport.IPublish {
			eventName: string;
		}

		export interface ISubscribe extends Orizuru.Transport.ISubscribe {
			eventName: string;
		}

	}

}
