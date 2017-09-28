'use strict';

const
	Server = require('./index/server'),
	Handler = require('./index/handler'),

	/**
	 * Index file for project
	 * 
	 * @example
	 * // returns a Server
	 * require('@ffdc/nozomi').Server
	 * @example
	 * // returns a Handler
	 * require('@ffdc/nozomi').Handler
	 */
	Index = {
		Server,
		Handler
	};

module.exports = Index;
