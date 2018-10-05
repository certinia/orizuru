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
import express from 'express';
import { RequestHandler } from 'express-serve-static-core';
import http from 'http';

import { IServerImpl, Options, Publisher } from '..';
import { create as createRoute } from './server/route';
import * as ROUTE_METHOD from './server/routeMethod';
import { RouteValidator } from './validator/route';
import { ServerValidator } from './validator/server';

/**
 * @private
 */
const Router = express.Router;

/**
 * The Server for creating routes in a web dyno based on Avro schemas.
 *
 * Messages are consumed by {@link Handler}.
 */
export class Server extends EventEmitter {

	public static readonly ROUTE_METHOD = ROUTE_METHOD;

	/**
	 * The error event name.
	 */
	public static readonly ERROR = Symbol();

	/**
	 * The info event name.
	 */
	public static readonly INFO = Symbol();

	public readonly options: Options.IServer;
	private readonly publisher: Publisher;
	private readonly server: IServerImpl;
	private readonly validator: RouteValidator;
	private readonly routerConfiguration: { [s: string]: express.Router };

	private httpServer?: http.Server;

	/**
	 * Constructs a new 'Server'.
	 *
	 * @example
	 * const server = new Server();
	 */
	constructor(options: Options.IServer) {

		super();

		try {

			// Validate the server options
			new ServerValidator(options);

			this.options = options;

			// Add the server
			this.server = options.server || express();

			// Add the publisher
			this.publisher = new Publisher(options);

			// Make sure that  the publisher emits server error events
			this.publisher.on(Publisher.ERROR, (...args: any[]) => {
				this.emit(Server.ERROR, ...args);
			});

			// Make sure that  the publisher emits server info events
			this.publisher.on(Publisher.INFO, (...args: any[]) => {
				this.emit(Server.INFO, ...args);
			});

			// Define the router configuration for the server
			this.routerConfiguration = {};

			// Define the route validator
			this.validator = new RouteValidator();

		} catch (e) {
			this.error(e);
			throw e;
		}

	}

	/**
	 * Adds a 'route' to the server.
	 */
	public addRoute(options: Options.Route.IRaw) {

		// Validate the route options.
		const validatedRouteConfiguration = this.validator.validate(options);

		const { apiEndpoint, middlewares, fullSchemaName, method } = validatedRouteConfiguration;

		let router: any = this.routerConfiguration[apiEndpoint];

		// If we don't have the router for this endpoint then we need to create one.
		if (!router) {

			this.info(`Creating router for namespace: ${apiEndpoint}.`);

			// Create router.
			router = Router();

			// Add the router to the server.
			this.server.use(apiEndpoint, router);

			// Update the router configuration.
			this.routerConfiguration[apiEndpoint] = router;

		}

		this.info(`Adding route: ${fullSchemaName} (${method.toUpperCase()}).`);

		// Add the router method.
		router[method]('/', ...middlewares, createRoute(this, validatedRouteConfiguration));

		return this;

	}

	/**
	 * Starts the server listening for connections.
	 * This also initialises the transport connection.
	 */
	public async listen(callback?: (app: Server) => void) {

		await this.options.transport.connect();

		this.httpServer = this.server.listen(this.options.port, () => {
			this.info(`Listening to new connections on port: ${this.options.port}.`);
			if (callback) {
				callback(this);
			}
		});
		return this.httpServer;

	}

	/**
	 * Stops the server from accepting new connections.
	 */
	public async close(callback?: (app: Server) => void) {
		if (this.httpServer) {
			await this.httpServer.close(async () => {
				this.info(`Stopped listening to connections on port: ${this.options.port}.`);
				await this.options.transport.close();
				if (callback) {
					callback(this);
				}
			});
		} else {
			throw Error('The server has not started listening to connections.');
		}
	}

	/**
	 * Assigns setting `name` to `value`.
	 */
	public set(setting: string, val: any) {
		this.server.set(setting, val);
		return this;
	}

	/**
	 * Use the given request handlers for the specified paths.
	 */
	public use(path: string, ...handlers: RequestHandler[]) {
		this.server.use(path, ...handlers);
		return this;
	}

	/**
	 * Returns the server implementation.
	 *
	 * Defaults to express.
	 *
	 * @example
	 * // returns the server implementation
	 * server.getServer().listen('8080');
	 * @returns The server implementation.
	 */
	public getServer() {
		return this.server;
	}

	/**
	 * Returns the message publisher.
	 *
	 * @returns The message publisher.
	 */
	public getPublisher() {
		return this.publisher;
	}

	/**
	 * Emit an error event.
	 * @param event - The error event.
	 */
	public error(event: any) {
		this.emit(Server.ERROR, event);
	}

	/**
	 * Emit an info event.
	 * @param event - The info event.
	 */
	public info(event: any) {
		this.emit(Server.INFO, event);
	}

}
