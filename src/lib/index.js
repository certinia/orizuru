'use strict';
/**
 * The Index file for project.
 * Returns the Server and Handler classes.
 * @module index
 * @see module:index/server
 * @see module:index/handler
 * @see module:index/publisher
 */

const
	Server = require('./index/server'),
	Handler = require('./index/handler'),
	Publisher = require('./index/publisher');

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
	Handler,
	/**
	 * Publisher
	 * @see module:index/publisher~Publisher
	 */
	Publisher
};
