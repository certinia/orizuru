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

import { Schema, Type } from 'avsc';
import { Request, RequestHandler, Response } from 'express';
import http from 'http';

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

		/**
		 * The Handler interface for consuming messages in a worker dyno created by {@link Server}.
		 */
		interface IHandler {

			options: Options.IHandler;

			handle(options: IHandlerFunction): Promise<void>;

		}

		/**
		 * The Publisher interface for publishing messages based on Avro schemas.
		 */
		interface IPublisher {

			options: Options.IPublisher;

			publish(options: IPublishFunction): Promise<boolean>;

		}

		/**
		 * The Server interface for creating routes in a web dyno based on Avro schemas.
		 */
		interface IServer {

			options: Options.IServer;
			publisher: Orizuru.IPublisher;
			serverImpl: IServerImpl;

			addRoute(options: IRouteConfiguration): this;
			set(setting: string, val: any): this;
			use(path: string, ...handlers: RequestHandler[]): this;

			error(event: any): void;
			info(event: any): void;

		}

		interface Context { }

		interface Message { }

		interface IHandlerFunction { }

		interface IHandlerResponse { }

		interface IPublishFunction { }

		interface IRouteConfiguration { }

		namespace Options {

			interface IHandler { }

			interface IPublisher { }

			interface IServer { }

		}

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
export interface IOrizuruMessage<C extends Orizuru.Context, M extends Orizuru.Message> {

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

/**
 * A function to write a response to the client.
 *
 * This function should always handle errors.
 */
export type ResponseWriterFunction = (server: Orizuru.IServer) => (error: Error | undefined, request: Request, response: Response) => void | Promise<void>;

export declare namespace Options {

	export interface IHandler extends Orizuru.Options.IHandler {

		/**
		 * The transport layer for the handler.
		 */
		transport: ITransport;

	}

	export interface IPublisher extends Orizuru.Options.IPublisher {

		/**
		 * The transport layer for the publisher.
		 */
		transport: ITransport;

	}

	export interface IServer extends Orizuru.Options.IServer {

		/**
		 * The port on which the server should listen.
		 */
		port: number;

		server?: IServerImpl;

		/**
		 * The transport layer for the server.
		 */
		transport: ITransport;
	}

	export interface IPublishFunction<C extends Orizuru.Context, M> extends Orizuru.IPublishFunction {

		/**
		 * The message to be published.
		 */
		message: IOrizuruMessage<C, M>;

		/**
		 * An [Apache Avro](https://avro.apache.org/docs/current/) schema.
		 */
		schema: Schema;

		/**
		 * The publish options required for the transport layer.
		 */
		publishOptions?: Options.Transport.IPublish;
	}

	export interface IHandlerFunction<C extends Orizuru.Context, M> extends Orizuru.IHandlerFunction {

		/**
		 * An [Apache Avro](https://avro.apache.org/docs/current/) schema.
		 */
		schema: Schema;

		/**
		 * A function that handles this [Apache Avro](https://avro.apache.org/docs/current/) schema.
		 */
		handler: HandlerFunction<C, M>;

		/**
		 * The subscription options required for the transport layer.
		 */
		subscribeOptions?: Options.Transport.ISubscribe;
	}

	export interface IRouteConfiguration extends Orizuru.IRouteConfiguration {

		/**
		 * The base endpoint for this route.
		 *
		 * By default, the url is constructed using the namepace and name of the Avro schema.
		 * This parameter adds a prefix to that url.
		 *
		 * Note that the transport eventName omits this part of the url.
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

		/**
		 * A function that maps the schema namespace to the required format.
		 */
		pathMapper?: (schemaNamespace: string) => string;

		/**
		 * The publish options required for the transport layer.
		 */
		publishOptions?: Options.Transport.IPublish;

		/**
		 * Function to determine how the response is written to the server.
		 */
		responseWriter?: ResponseWriterFunction;

		/**
		 * The Apache Avro schema that messages for this route should be validated against.
		 */
		schema: Schema;

		/**
		 * Determines whether this process is dealt with synchronously.
		 * By default, false.
		 */
		synchronous?: boolean;

	}

	export namespace Transport {

		export interface IPublish extends Orizuru.Transport.IPublish {

			/**
			 * The name of the queue to which messages are published.
			 */
			eventName: string;

			/**
			 * The context for this message.
			 *
			 * In some cases, the transport layer determines where to publish the message from a context property.
			 * The context is here for convenience so that the transport layer does not need to decode the supplied buffer.
			 */
			context?: Orizuru.Context;

			/**
			 * The raw message to be published.
			 *
			 * In some cases, the transport layer determines where to publish the message from a message property.
			 * The message is here for convenience so that the transport layer does not need to decode the supplied buffer.
			 */
			message?: any;

			/**
			 * The Avro schema for this message.
			 */
			schema?: AvroSchema;

		}

		export interface ISubscribe extends Orizuru.Transport.ISubscribe {

			/**
			 * The name of the queue from which messages are consumed.
			 */
			eventName: string;

		}

	}

}
