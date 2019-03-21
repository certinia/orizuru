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
 * @module server
 */

import { EventEmitter } from 'events';
import express from 'express';
import { ErrorRequestHandler, RequestHandler } from 'express-serve-static-core';
import http from 'http';

import { IServerImpl, Options, Publisher } from '..';
import { create as createRoute } from './server/route';
import * as ROUTE_METHOD from './server/routeMethod';
import { RouteValidator } from './validator/route';
import { ServerValidator } from './validator/server';

const Router = express.Router;

/**
 * The Server for creating routes in a web dyno based on Avro schemas.
 *
 * Messages are consumed by {@link Handler}.
 * @extends EventEmitter
 */
export class Server extends EventEmitter {

	/**
	 * The HTTP methods (DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT, TRACE)
	 */
	public static readonly ROUTE_METHOD = ROUTE_METHOD;

	/**
	 * The error event symbol.
	 */
	public static readonly ERROR = Symbol();

	/**
	 * The info event symbol.
	 */
	public static readonly INFO = Symbol();

	/**
	 * The server options.
	 */
	public readonly options: Options.IServer;

	/**
	 * The publisher that is used to publish Orizuru messages via the transport layer.
	 */
	private readonly publisherImpl: Publisher;

	/**
	 * The server implementation.
	 *
	 * Express is used by default.
	 */
	private readonly server: IServerImpl;

	/**
	 * The route validator.
	 *
	 * This validates that the routes that are added to the server contain the correct information.
	 */
	private readonly validator: RouteValidator;

	/**
	 * An internal map of each of the routes to the appropriate Express Router.
	 *
	 * For example, if a route is added using the GET and POST method, the map contains
	 * a single entry for the route with both the GET and POST methods added to a single
	 * router.
	 */
	private readonly routerConfiguration: { [s: string]: express.Router };

	/**
	 * The root HTTP server that is used to recieve incoming traffic.
	 */
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
			this.publisherImpl = new Publisher(options);

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
	 * Adds a route to the server.
	 *
	 * @param options The route configuration options.
	 */
	public addRoute(options: Options.IRouteConfiguration) {

		// Validate the route options.
		const validatedRouteConfiguration = this.validator.validate(options);

		const { apiEndpoint, middleware, fullSchemaName, method } = validatedRouteConfiguration;

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
		router[method]('/', ...middleware, createRoute(this, validatedRouteConfiguration));

		return this;

	}

	/**
	 * Starts the server listening for connections.
	 * This also initialises the transport connection.
	 *
	 * @param [callback] Optional callback to invoke after the server has started listening to connections.
	 */
	public async listen(callback?: (app: Orizuru.IServer) => void) {

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
	 *
	 * @param [callback] Optional callback to invoke after the server has stopped listening to connections.
	 */
	public async close(callback?: (app: Orizuru.IServer) => void) {
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
	 *
	 * @param setting The setting name.
	 * @param val The setting value.
	 */
	public set(setting: string, val: any) {
		this.server.set(setting, val);
		return this;
	}

	/**
	 * Use the given request handlers for the specified paths.
	 *
	 * @param path The path for the incoming request.
	 * @param handlers The middleware to be used when processing the incoming request.
	 */
	public use(path: string, ...handlers: Array<ErrorRequestHandler | RequestHandler>) {
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
	 * server.serverImpl.listen('8080');
	 * @returns The server implementation.
	 */
	public get serverImpl() {
		return this.server;
	}

	/**
	 * Returns the message publisher.
	 *
	 * @returns The message publisher.
	 */
	public get publisher() {
		return this.publisherImpl;
	}

	/**
	 * Emit an error event.
	 *
	 * @param event The error event.
	 */
	public error(event: any) {
		this.emit(Server.ERROR, event);
	}

	/**
	 * Emit an info event.
	 *
	 * @param event The info event.
	 */
	public info(event: any) {
		this.emit(Server.INFO, event);
	}

}
