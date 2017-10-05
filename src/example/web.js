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
	root = require('app-root-path'),

	// get the server
	{ Server } = require(root + '/src/lib/index'),

	// get the transport
	transport = require('@financialforcedev/nozomi-transport-rabbitmq'),

	// configure the transport
	transportConfig = {
		cloudamqpUrl: 'amqp://localhost'
	},

	// get schemas
	schemaNameToDefinition = require('./schemas'),

	// define the endpoint ( in this case: /api/{schemaname} )
	apiEndpoint = '/api',

	// define middlewares (in order of usage)
	middlewares = [(req, res, next) => {
		// just sets auth on the body for transport, should in reality authenticate
		// and then send a 403 if authentication fails first
		req.nozomi = { auth: 'test auth token or whatever, object containing id, name, etc' };
		next();
	}],

	// define port (should be an env var in production)
	port = 5555;

// listen using the schemas
// you could call 'addRoute' multiple times to add different sets of schemas on different endpoints with different middlewares, etc
// apiEndpoint defaults to '/{schemaname}', middlewares defaults to []
new Server({ transport, transportConfig })
	.addRoute({ schemaNameToDefinition, apiEndpoint, middlewares })
	.getServer()
	// getServer returns the express server, you could push other routes on to it (public folders, etc) at this point
	.listen(port);
