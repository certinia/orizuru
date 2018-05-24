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

// get the server
import { Server, OrizuruRequest } from '../lib/index';
import { Response, NextFunction } from 'express';

const
	debug = require('debug-plus')('web'),

	// get the transport
	transport = require('@financialforcedev/orizuru-transport-rabbitmq'),

	// configure the transport
	transportConfig = {
		cloudamqpUrl: 'amqp://localhost'
	},

	// get schemas
	schemas = require('./schemas'),

	// define port (should be an env var in production)
	PORT = 5555,

	// define the endpoint ( in this case: /api/{schemaname} )
	apiEndpoint = '/api/',

	// define middlewares (in order of usage)
	middlewares = [(req: OrizuruRequest, res: Response, next: NextFunction) => {
		// just sets auth on the body for transport, should in reality authenticate
		// and then send a 403 if authentication fails first
		req.orizuru = { auth: 'test auth token or whatever, object containing id, name, etc' };
		next();
	}];

// Create a simple extension of the server to debug out error and info events.
class Web extends Server {

	constructor(config: any) {

		super(config);

		const
			me = this,
			publisher = me.getPublisher();

		// Debug out errors and info messages from the server.
		me.on(Server.ERROR, debug.error);
		me.on(Server.INFO, debug.log);

		// Debug out errors and info messages from the publisher.
		publisher.on(Server.ERROR, debug.error);
		publisher.on(Server.INFO, debug.log);
	}

}

// Initialise the Web server.
// Listen on the given port with the specified routes.
new Web({ transport, transportConfig })
	.addRoute({ schema: schemas.ageAndDob, endpoint: apiEndpoint, middlewares })
	.addRoute({ schema: schemas.firstAndLastName, endpoint: apiEndpoint, middlewares })
	.getServer()
	// getServer returns the express server, you could push other routes on to it (public folders, etc) at this point
	.listen(PORT);
