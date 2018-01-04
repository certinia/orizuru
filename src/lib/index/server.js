/**
 * Copyright (c) 2017, FinancialForce.com, inc
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

const
	_ = require('lodash'),
	express = require('express'),

	EventEmitter = require('events'),
	Publisher = require('./publisher'),

	route = require('./server/route'),

	RouteValidator = require('./validator/route'),
	ServerValidator = require('./validator/server'),

	expressRouter = express.Router,

	PARAMETER_API_SCHEMA_ENDPOINT = '/:schemaName',

	PROPERTY_PUBLISHER = 'publisher',
	PROPERTY_ROUTE_CONFIGURATION = 'route_configuration',
	PROPERTY_ROUTER_CONFIGURATION = 'router_configuration',
	PROPERTY_ROUTE_VALIDATOR = 'route_validator',
	PROPERTY_SERVER = 'server',

	ERROR_EVENT = 'error_event',
	INFO_EVENT = 'info_event';

/** 
 * The Server for creating routes in a web dyno based on Avro schemas. 
 * Messages are consumed by Handler
 * 
 * @extends EventEmitter
 * @property {string} emitter.ERROR - the error event name
 * @property {string} emitter.INFO - the info event name
 **/
class Server extends EventEmitter {

	/**
	 * Constructs a new 'Server'.
	 * 
	 * @example 
	 * const server = new Server();
	 * @param {Object} config - The server configuration.
	 * @param {Transport} config.transport - The transport object.
	 * @param {Object} config.transportConfig - The config for the transport object.
	 */
	constructor(config) {

		super();

		const me = this;
		me.info('Creating server.');

		try {

			// Validate the config
			new ServerValidator(config);

			// Create the express server
			const server = express();

			// Add the server
			Object.defineProperty(me, PROPERTY_SERVER, { value: server });

			// Add the publisher
			Object.defineProperty(me, PROPERTY_PUBLISHER, { value: new Publisher(config) });

			// Define the router configuration for the server
			Object.defineProperty(me, PROPERTY_ROUTER_CONFIGURATION, { value: {} });

			// Define the route configuration for the server
			Object.defineProperty(me, PROPERTY_ROUTE_CONFIGURATION, { value: {} });

			// Define the route validator
			Object.defineProperty(me, PROPERTY_ROUTE_VALIDATOR, { value: new RouteValidator() });

		} catch (e) {
			me.error(e);
			throw e;
		}

	}

	/**
	 * Adds a 'route' to the server.
	 * 
	 * @param {Object} config - The route.
	 * @param {string|Object} config.schema - The Apache Avro schema for this route.
	 * @param {string} config.method=POST - The method to use for this route.
	 * @param {Function[]} config.middlewares - The middleware functions for this route.
	 * @param {Function} config.responseWriter - The function to use before writing the response.
	 * @param {string} [config.endpoint=/] - The API endpoint.
	 * 
	 * @returns {Server} The server.
	 */
	addRoute(config) {

		// Validate the route configuration.
		this[PROPERTY_ROUTE_VALIDATOR].validate(config);

		// Now we know the configuration is valid, add the route.
		const
			me = this,
			schema = config.schema,
			responseWriter = config.responseWriter,
			fullSchemaName = schema.name,
			schemaNameParts = fullSchemaName.split('.'),
			schemaNamespace = _.initial(schemaNameParts).join('.'),
			schemaName = _.last(schemaNameParts),
			apiEndpoint = `${config.endpoint}${schemaNamespace}`.replace(/\./g, '/'),

			routeConfiguration = _.get(me, `${PROPERTY_ROUTE_CONFIGURATION}.${apiEndpoint}`, {});

		let router = _.get(me[PROPERTY_ROUTER_CONFIGURATION], apiEndpoint);

		// If we don't have the router for this endpoint then we need to create one.
		if (!router) {

			me.info(`Creating router for namespace: ${apiEndpoint}.`);

			// Create router.
			router = expressRouter();

			// Apply middlewares.
			_.each(config.middleware, middleware => {
				router.use(middleware);
			});

			// Add the router to the server.
			me[PROPERTY_SERVER].use(apiEndpoint, router);

			// Update the router configuration.
			_.set(me[PROPERTY_ROUTER_CONFIGURATION], apiEndpoint, router);

		}

		// Update the route configuration.
		_.set(routeConfiguration, schemaName, schema);
		_.set(me[PROPERTY_ROUTE_CONFIGURATION], apiEndpoint, routeConfiguration);

		me.info(`Adding route: ${fullSchemaName}.`);

		// Add the router method.
		router[config.method](PARAMETER_API_SCHEMA_ENDPOINT, route.create(me, routeConfiguration, responseWriter));

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
		return this[PROPERTY_SERVER];
	}

	/**
	 * Returns the message publisher.
	 * 
	 * @returns {Publisher} The message publisher.
	 */
	getPublisher() {
		return this[PROPERTY_PUBLISHER];
	}

	/**
	 * Emit an error event.
	 * @param {Object} event - The error event.
	 */
	error(event) {
		this.emit(ERROR_EVENT, event);
	}

	/**
	 * Emit an info event.
	 * @param {Object} event - The info event.
	 */
	info(event) {
		this.emit(INFO_EVENT, event);
	}

}

/**
 * The error event name.
 */
Server.ERROR = ERROR_EVENT;

/**
 * The info event name.
 */
Server.INFO = INFO_EVENT;

module.exports = Server;

Server.ROUTE_METHOD = require('./server/routeMethod');
