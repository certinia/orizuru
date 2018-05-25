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

import { Request, Response } from 'express';
import * as HTTP_STATUS_CODE from 'http-status-codes';
import _ from 'lodash';
import { Server } from '../..';
import * as ROUTE_METHOD from '../server/routeMethod';
import * as schema from './shared/schema';

/**
 * Validates routes.
 * @private
 */
export default class RouteValidator {

	public validate(config: any) {

		if (!config) {
			throw new Error('Missing required object parameter.');
		}

		if (!_.isPlainObject(config)) {
			throw new Error(`Invalid parameter: ${config} is not an object.`);
		}

		if (!config.endpoint) {
			config.endpoint = '/';
		}

		if (!_.isString(config.endpoint)) {
			throw new Error('Invalid parameter: endpoint is not a string.');
		}

		if (!config.method) {
			config.method = ROUTE_METHOD.POST;
		}

		if (!_.isString(config.method)) {
			throw new Error('Invalid parameter: method is not a string.');
		}

		if (!_.find(_.values(ROUTE_METHOD), (value) => value === config.method)) {
			throw new Error(`Invalid parameter: method must be one of the following options: ${_.values(ROUTE_METHOD)}. Got ${config.method}.`);
		}

		if (!config.middleware) {
			config.middleware = [];
		}

		if (!_.isArray(config.middleware)) {
			throw new Error('Invalid parameter: middleware is not an array.');
		}

		_.each(config.middleware, (middleware, index) => {
			if (!_.isFunction(middleware)) {
				throw new Error(`Invalid parameter: middleware[${index}] is not a function.`);
			}
		});

		if (!config.responseWriter) {
			config.responseWriter = (server: Server) => (error: Error, request: Request, response: Response) => {
				if (error) {
					server.error(error);
					response.status(HTTP_STATUS_CODE.BAD_REQUEST).send(error);
				} else {
					response.status(HTTP_STATUS_CODE.OK).send('Ok.');
				}
			};
		}

		if (!_.isFunction(config.responseWriter)) {
			throw new Error('Invalid parameter: responseWriter is not a function.');
		}

		if (!config.pathMapper) {
			config.pathMapper = (namespace: string) => namespace.replace(/\./g, '/');
		}

		if (!_.isFunction(config.pathMapper)) {
			throw new Error('Invalid parameter: pathMapper is not a function.');
		}

		// Validate the schema
		schema.validate(config);

		return config;
	}

}
