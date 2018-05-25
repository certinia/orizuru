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
 **/

'use strict';

import _ from 'lodash';
import { EventEmitter } from 'events';
import { Publisher } from '..';
import * as ROUTE_METHOD from './server/routeMethod';
import express from 'express';
import RouteValidator from './validator/route';
import ServerValidator from './validator/server';
import { create as createRoute } from './server/route';

const
	Router = express.Router,
	PARAMETER_API_SCHEMA_ENDPOINT = '/:schemaName';

/**
 * The Server for creating routes in a web dyno based on Avro schemas.
 * Messages are consumed by Handler
 *
 * @extends EventEmitter
 * @property {string} emitter.ERROR - the error event name
 * @property {string} emitter.INFO - the info event name
 **/
export default class Server extends EventEmitter {

	static readonly ROUTE_METHOD = ROUTE_METHOD;

	/**
	 * The error event name.
	 */
	static readonly ERROR: string = 'error_event';

	/**
	 * The info event name.
	 */
	static readonly INFO: string = 'info_event';

	private readonly publisher: Publisher;
	private readonly server: express.Express;
	private readonly validator: RouteValidator;
	private readonly routerConfiguration: any;
	private readonly routeConfiguration: any;

	/**
	 * Constructs a new 'Server'.
	 *
	 * @example
	 * const server = new Server();
	 * @param {Object} config - The server configuration.
	 * @param {Transport} config.transport - The transport object.
	 * @param {Object} config.transportConfig - The config for the transport object.
	 */
	constructor(config: any) {

		super();

		this.info('Creating server.');

		try {

			// Validate the config
			new ServerValidator(config);

			// Add the server
			this.server = express();

			// Add the publisher
			this.publisher = new Publisher(config);

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
	addRoute(config: any) {

		// Validate the route configuration.
		this.validator.validate(config);

		// Now we know the configuration is valid, add the route.
		const
			schema = config.schema,
			responseWriter = config.responseWriter,
			fullSchemaName = schema.name,
			schemaNameParts = fullSchemaName.split('.'),
			schemaNamespace = _.initial(schemaNameParts).join('.'),
			schemaName = <string>_.last(schemaNameParts),
			apiEndpoint = config.endpoint + config.pathMapper(schemaNamespace);

		let
			routeConfiguration = this.routeConfiguration[apiEndpoint],
			router = this.routerConfiguration[apiEndpoint];

		// If we don't have the router for this endpoint then we need to create one.
		if (!router) {

			this.info(`Creating router for namespace: ${apiEndpoint}.`);

			// Create router.
			router = Router();

			// Apply middlewares.
			_.each(config.middleware, middleware => {
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
		router[config.method](PARAMETER_API_SCHEMA_ENDPOINT, createRoute(this, routeConfiguration, responseWriter, config.transportConfig));

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
	getServer() {
		return this.server;
	}

	/**
	 * Returns the message publisher.
	 *
	 * @returns {Publisher} The message publisher.
	 */
	getPublisher() {
		return this.publisher;
	}

	/**
	 * Emit an error event.
	 * @param {Object} event - The error event.
	 */
	error(event: any) {
		this.emit(Server.ERROR, event);
	}

	/**
	 * Emit an info event.
	 * @param {Object} event - The info event.
	 */
	info(event: any) {
		this.emit(Server.INFO, event);
	}

}


