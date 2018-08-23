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

import { Type } from 'avsc';
import * as HTTP_STATUS_CODE from 'http-status-codes';
import _ from 'lodash';

import { Options } from '../..';
import * as RouteMethod from '../server/routeMethod';
import { SchemaValidator } from './shared/schema';

/**
 * Validates the {@link Route} configuration.
 * @private
 */
export class RouteValidator {

	public validate(options: Options.Route.IRaw): Options.Route.IValidated {

		if (!options) {
			throw new Error('Missing required object parameter.');
		}

		if (!_.isPlainObject(options)) {
			throw new Error(`Invalid parameter: ${options} is not an object.`);
		}

		if (options.endpoint && !_.isString(options.endpoint)) {
			throw new Error('Invalid parameter: endpoint is not a string.');
		}

		if (options.method && !_.isString(options.method)) {
			throw new Error('Invalid parameter: method is not a string.');
		}

		if (options.method && !_.find(_.values(RouteMethod), (value) => value === options.method)) {
			throw new Error(`Invalid parameter: method must be one of the following options: ${_.values(RouteMethod)}. Got ${options.method}.`);
		}

		if (options.middleware && !_.isArray(options.middleware)) {
			throw new Error('Invalid parameter: middleware is not an array.');
		}

		_.each(options.middleware, (middleware, index) => {
			if (!_.isFunction(middleware)) {
				throw new Error(`Invalid parameter: middleware[${index}] is not a function.`);
			}
		});

		if (options.responseWriter && !_.isFunction(options.responseWriter)) {
			throw new Error('Invalid parameter: responseWriter is not a function.');
		}

		if (options.pathMapper && !_.isFunction(options.pathMapper)) {
			throw new Error('Invalid parameter: pathMapper is not a function.');
		}

		// Validate the schema
		new SchemaValidator().validate(options);

		const validatedOptions: Options.Route.IValidated = {
			endpoint: '/',
			method: RouteMethod.POST,
			middleware: [],
			pathMapper: (namespace: string) => namespace.replace(/\./g, '/'),
			publishOptions: options.publishOptions,
			responseWriter: (server) => (error, request, response) => {
				if (error) {
					server.error(error);
					response.status(HTTP_STATUS_CODE.BAD_REQUEST).send(error);
				} else {
					response.status(HTTP_STATUS_CODE.OK).send('Ok.');
				}
			},
			schema: options.schema as Type
		};

		validatedOptions.endpoint = options.endpoint || validatedOptions.endpoint;
		validatedOptions.method = options.method || validatedOptions.method;
		validatedOptions.middleware = options.middleware || validatedOptions.middleware;
		validatedOptions.pathMapper = options.pathMapper || validatedOptions.pathMapper;
		validatedOptions.responseWriter = options.responseWriter || validatedOptions.responseWriter;

		return validatedOptions;
	}

}
