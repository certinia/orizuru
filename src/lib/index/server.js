'use strict';
/**
 * The Server for creating routes in a web dyno based on Avro schemas. 
 * Messages are consumed by Handler
 * @module index/server
 * @see module:index/handler
 */

const
	_ = require('lodash'),
	express = require('express'),
	expressRouter = express.Router,
	bodyParser = require('body-parser'),
	helmet = require('helmet'),

	SCHEMA_API_PARAM = '/:schemaName',

	{ compileSchemas } = require('./shared/compileSchemas'),
	Publisher = require('./publisher'),

	serverStore = new WeakMap(),
	publisherStore = new WeakMap(),

	api = (path, schemaNameToDefinition, publisher) => (request, response) => {

		const
			schemaName = request.params.schemaName,
			schema = schemaNameToDefinition[schemaName],
			body = request.body,
			nozomi = request.nozomi;

		if (!schema) {
			response.status(400).send(`No schema for '${path}/${schemaName}' found.`);
		} else {
			publisher.publish({
				eventName: `${path}/${schemaName}`,
				schema: schema,
				message: body,
				context: nozomi
			}).then(() => {
				response.status(200).send('Ok.');
			}).catch(err => {
				response.status(400).send(err.message);
			});
		}

	};

/** Class representing a server. */
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
		publisherStore[this] = new Publisher(config);

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
		compileSchemas(schemaNameToDefinition);

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

module.exports = Server;
