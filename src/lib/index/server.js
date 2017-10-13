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
/**
 * The Server for creating routes in a web dyno based on Avro schemas. 
 * Messages are consumed by Handler
 * @module index/server
 * @see module:index/handler
 */

const
	_ = require('lodash'),
	EventEmitter = require('events'),
	express = require('express'),
	expressRouter = express.Router,
	bodyParser = require('body-parser'),
	helmet = require('helmet'),

	SCHEMA_API_PARAM = '/:schemaName',

	{ compileSchemas } = require('./shared/compileSchemas'),
	Publisher = require('./publisher'),

	serverStore = new WeakMap(),
	publisherStore = new WeakMap(),

	{ catchEmitThrow, catchEmitReject } = require('./shared/catchEmitThrow'),

	emitter = new EventEmitter(),

	ERROR_EVENT = 'error_event',
	INFO_EVENT = 'info_event',

	api = (path, schemaNameToDefinition, publisher) => (request, response) => {

		const
			schemaName = request.params.schemaName,
			schema = schemaNameToDefinition[schemaName],
			body = request.body,
			nozomi = request.nozomi;

		if (!schema) {
			catchEmitReject(`No schema for '${path}/${schemaName}' found.`, ERROR_EVENT, emitter)
				.catch(err => {
					response.status(400).send(err.message);
				});
		} else {
			catchEmitReject(publisher.publish({
				eventName: `${path}/${schemaName}`,
				schema: schema,
				message: body,
				context: nozomi
			}), ERROR_EVENT, emitter).then(() => {
				emitter.emit(INFO_EVENT, `Server published ${path}/${schemaName} event.`);
				response.status(200).send('Ok.');
			}).catch(err => {
				response.status(400).send(err.message);
			});
		}

	};

/** 
 * Class representing a server. 
 * 
 * @property {EventEmitter} emitter
 * @property {string} emitter.ERROR - the error event name
 * @property {string} emitter.INFO - the info event name
 **/
class Server {

	/**
	 * Constructs a new 'Server'
	 * 
	 * @param {object} config - { transport [, transportConfig] }
	 * @param {transport} config.transport - the transport object
	 * @param {object} config.transportConfig - config for the transport object
	 * @returns {Server}
	 */
	constructor(config) {

		// create publisher
		catchEmitThrow(() => {
			publisherStore[this] = new Publisher(config);
		}, ERROR_EVENT, emitter);

		// create server
		const server = express();

		// body parser
		server.use(bodyParser.json());

		// Header security
		server.use(helmet());

		// add server to private store
		serverStore[this] = server;

	}

	/**
	 * Adds a 'route' to the server
	 * 
	 * @example
	 * // adds schemas to the default ( http://host/{schemaName} ) route
	 * server.addRoute({
	 * 	schemaNameToDefinition: {
	 * 		test: {} // an avro compliant schema (see avro schema API)
	 * 	}
	 * });
	 * @example
	 * // adds schemas to a route at ( http://host/api/test/{schemaName} )
	 * server.addRoute({ schemaNameToDefinition, apiEndpoint: '/api/test' });
	 * @example
	 * // adds middleware functions contained in the middlewares array (see express middleware API)
	 * server.addRoute({ schemaNameToDefinition, middlewares: [...] });
	 * 
	 * @param {object} config - { schemaNameToDefinition [, middlewares] [, apiEndpoint] }
	 * @param {object} config.schemaNameToDefinition - schema name to definition map
	 * @param {object} config.middlewares - middleware functions (optional)
	 * @param {object} config.apiEndpoint - api endpoint (optional, default: /)
	 * 
	 * @returns {Server}
	 */
	addRoute({ schemaNameToDefinition, middlewares, apiEndpoint }) {

		// create router
		const
			publisher = publisherStore[this],
			router = expressRouter();

		// validate
		if (!_.isString(apiEndpoint)) {
			apiEndpoint = '';
		}
		if (!_.isArray(middlewares)) {
			middlewares = [];
		}

		// compile schemas
		catchEmitThrow(() => {
			compileSchemas(schemaNameToDefinition);
		}, ERROR_EVENT, emitter);

		// apply middlewares
		_.each(middlewares, middleware => {
			if (_.isFunction(middleware)) {
				router.use(middleware);
			}
		});

		// add post method
		router.post(SCHEMA_API_PARAM, api(apiEndpoint, schemaNameToDefinition, publisher));

		serverStore[this].use(apiEndpoint, router);

		return this;

	}

	/**
	 * Returns the express server
	 * 
	 * @example
	 * // returns the express server
	 * server.getServer().listen('8080');
	 * @returns {express}
	 */
	getServer() {
		return serverStore[this];
	}

}

Server.emitter = emitter;
emitter.ERROR = ERROR_EVENT;
emitter.INFO = INFO_EVENT;

module.exports = Server;
