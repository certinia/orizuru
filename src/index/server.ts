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

import { Type } from 'avsc';
import { EventEmitter } from 'events';
import express from 'express';
import _ from 'lodash';

import { Options, Publisher } from '..';
import { create as createRoute } from './server/route';
import * as ROUTE_METHOD from './server/routeMethod';
import { RouteValidator } from './validator/route';
import { ServerValidator } from './validator/server';

/**
 * @private
 */
const Router = express.Router;

/**
 * @private
 */
const PARAMETER_API_SCHEMA_ENDPOINT = '/:schemaName';

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
	public static readonly ERROR: string = 'error_event';

	/**
	 * The info event name.
	 */
	public static readonly INFO: string = 'info_event';

	private readonly publisher: Publisher;
	private readonly server: express.Express;
	private readonly validator: RouteValidator;
	private readonly routerConfiguration: { [s: string]: express.Router };
	private readonly routeConfiguration: { [s: string]: { [s: string]: Type } };

	/**
	 * Constructs a new 'Server'.
	 *
	 * @example
	 * const server = new Server();
	 */
	constructor(options: Options.IServer) {

		super();

		this.info('Creating server.');

		try {

			// Validate the server options
			new ServerValidator(options);

			// Add the server
			this.server = express();

			// Add the publisher
			this.publisher = new Publisher(options);

			// Define the router configuration for the server
			this.routerConfiguration = {};

			// Define the route configuration for the server
			this.routeConfiguration = {};

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
		const validatedOptions = this.validator.validate(options);

		// Now we know the options are valid, add the route.
		const schema = validatedOptions.schema;
		const fullSchemaName = schema.name as string;
		const schemaNameParts = fullSchemaName.split('.');
		const schemaNamespace = _.initial(schemaNameParts).join('.');
		const schemaName = _.last(schemaNameParts) as string;
		const apiEndpoint = validatedOptions.endpoint + validatedOptions.pathMapper(schemaNamespace);

		let routeConfiguration = this.routeConfiguration[apiEndpoint];
		let router: any = this.routerConfiguration[apiEndpoint];

		// If we don't have the router for this endpoint then we need to create one.
		if (!router) {

			this.info(`Creating router for namespace: ${apiEndpoint}.`);

			// Create router.
			router = Router();

			// Apply middlewares.
			_.each(validatedOptions.middleware, (middleware) => {
				router.use(middleware);
			});

			// Add the router to the server.
			this.server.use(apiEndpoint, router);

			// Update the router configuration.
			this.routerConfiguration[apiEndpoint] = router;

		}

		if (!routeConfiguration) {
			routeConfiguration = {};
			this.routeConfiguration[apiEndpoint] = routeConfiguration;
		}

		// Update the route configuration.
		routeConfiguration[schemaName] = schema;

		this.info(`Adding route: ${fullSchemaName}.`);

		// Add the router method.
		router[validatedOptions.method](PARAMETER_API_SCHEMA_ENDPOINT, createRoute(this, routeConfiguration, validatedOptions));

		return this;

	}

	/**
	 * Returns the express server.
	 *
	 * @example
	 * // returns the express server
	 * server.getServer().listen('8080');
	 * @returns {express} The express server.
	 */
	public getServer() {
		return this.server;
	}

	/**
	 * Returns the message publisher.
	 *
	 * @returns {Publisher} The message publisher.
	 */
	public getPublisher() {
		return this.publisher;
	}

	/**
	 * Emit an error event.
	 * @param {Object} event - The error event.
	 */
	public error(event: any) {
		this.emit(Server.ERROR, event);
	}

	/**
	 * Emit an info event.
	 * @param {Object} event - The info event.
	 */
	public info(event: any) {
		this.emit(Server.INFO, event);
	}

}
