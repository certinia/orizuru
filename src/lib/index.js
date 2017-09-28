'use strict';
/**
 * The Index file for project.
 * Returns the Server and Handler classes.
 * @module index
 * @see module:index/server
 * @see module:index/handler
 */

const
	Server = require('./index/server'),
	Handler = require('./index/handler');

module.exports = {
	/**
	 * Server
	 * @see module:index/server~Server
	 */
	Server,
	/**
	 * Handler
	 * @see module:index/handler~Handler
	 */
	Handler
};
