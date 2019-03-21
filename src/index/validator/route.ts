/*
 * Copyright (c) 2017-2019, FinancialForce.com, inc
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

/**
 * @module validator/route
 */

import { ErrorRequestHandler, RequestHandler } from 'express-serve-static-core';
import { BAD_REQUEST, OK } from 'http-status-codes';
import { isArray, isBoolean, isFunction, isPlainObject, isString } from 'lodash';

import { AvroSchema, Options, Request, Response, ResponseWriterFunction } from '../..';
import * as RouteMethod from '../server/routeMethod';
import { SchemaValidator } from './shared/schema';

export interface RouteConfiguration {

	/**
	 * The API endpoint for this route.
	 */
	apiEndpoint: string;

	/**
	 * The full name for the schema.
	 */
	fullSchemaName: string;

	/**
	 * The HTTP method for this route.
	 */
	method: string;

	/**
	 * The middleware for this route.
	 */
	middleware: Array<ErrorRequestHandler | RequestHandler>;

	/**
	 * A function that maps the schema namespace to the required format.
	 */
	pathMapper: (schemaNamespace: string) => string;

	/**
	 * The publish options required for the transport layer.
	 */
	publishOptions: Options.Transport.IPublish;

	/**
	 * Writes the response to the incoming request.
	 */
	responseWriter: ResponseWriterFunction;

	/**
	 * The [Apache Avro](https://avro.apache.org/docs/current/) schema that messages for this route should be validated against.
	 */
	schema: AvroSchema;

	/**
	 * The schema name.
	 */
	schemaName: string;

	/**
	 * Determines whether this process is dealt with synchronously.
	 * By default, false.
	 */
	synchronous?: boolean;

}

/**
 * The default response writer.
 *
 * @param server The Orizuru server instance.
 */
function defaultResponseWriter(server: Orizuru.IServer) {

	return (error: Error | undefined, request: Request, response: Response) => {
		if (error) {
			server.error(error);
			response.status(BAD_REQUEST).send({
				error: error.message
			});
		} else {
			response.sendStatus(OK);
		}
	};

}

/**
 * Generates the default path for the route.
 *
 * @param namespace The schema namespace.
 */
function defaultPathMapper(namespace: string) {
	return namespace.replace(/\./g, '/').replace('_', '.');
}

/**
 * Generates the endpoint for the route.
 *
 * @param [endpoint] Optional endpoint to validate.
 */
function getEndpoint(endpoint?: string) {

	if (!endpoint) {
		return '/';
	}

	if (endpoint.startsWith('/')) {
		return endpoint;
	}

	return '/' + endpoint;

}

/**
 * Gets the schema name from the [Apache Avro](https://avro.apache.org/docs/current/) schema.
 *
 * @param avroSchema The [Apache Avro](https://avro.apache.org/docs/current/) schema.
 */
function getSchemaName(avroSchema: AvroSchema) {
	const schemaNameParts = avroSchema.name.split('.');
	return schemaNameParts.pop() as string;
}

/**
 * Calculates the full API endpoint for this route.
 *
 * @param schema The [Apache Avro](https://avro.apache.org/docs/current/) schema.
 * @param endpoint The endpoint for the route.
 * @param pathMapper The path mapper.
 */
function calculateApiEndpoint(schema: AvroSchema, endpoint: string, pathMapper: (schemaNamespace: string) => string) {
	const schemaName = getSchemaName(schema);
	const schemaNameParts = schema.name.split('.');
	schemaNameParts.pop();
	const schemaNamespace = schemaNameParts.join('.');
	return endpoint + pathMapper(schemaNamespace) + '/' + schemaName;
}

/**
 * Validates the {@link Route} configuration.
 */
export class RouteValidator {

	/**
	 * Validate the route configuration options.
	 * @param options The route configuration options to validate.
	 */
	public validate(options: Options.IRouteConfiguration): RouteConfiguration {

		if (!options) {
			throw new Error('Missing required object parameter.');
		}

		if (!isPlainObject(options)) {
			throw new Error(`Invalid parameter: ${options} is not an object.`);
		}

		if (options.endpoint && !isString(options.endpoint)) {
			throw new Error('Invalid parameter: endpoint is not a string.');
		}

		if (options.method && !isString(options.method)) {
			throw new Error('Invalid parameter: method is not a string.');
		}

		if (options.method && !Object.values(RouteMethod).find((value) => value === options.method)) {
			throw new Error(`Invalid parameter: method must be one of the following options: ${Object.values(RouteMethod)}. Got ${options.method}.`);
		}

		if (options.middleware) {

			if (!isArray(options.middleware)) {
				throw new Error('Invalid parameter: middleware is not an array.');
			}

			options.middleware.forEach(((middleware, index) => {
				if (!isFunction(middleware)) {
					throw new Error(`Invalid parameter: middleware[${index}] is not a function.`);
				}
			}));

		}

		if (options.responseWriter && !isFunction(options.responseWriter)) {
			throw new Error('Invalid parameter: responseWriter is not a function.');
		}

		if (options.pathMapper && !isFunction(options.pathMapper)) {
			throw new Error('Invalid parameter: pathMapper is not a function.');
		}

		if (options.synchronous !== undefined && !isBoolean(options.synchronous)) {
			throw new Error('Invalid parameter: synchronous is not a boolean.');
		}

		// Validate the schema
		const avroSchema = new SchemaValidator().validate(options.schema);

		const endpoint = getEndpoint(options.endpoint);
		const pathMapper = options.pathMapper || defaultPathMapper;
		const apiEndpoint = calculateApiEndpoint(avroSchema, endpoint, pathMapper);

		const validatedOptions: RouteConfiguration = {
			apiEndpoint,
			fullSchemaName: avroSchema.name,
			method: options.method || RouteMethod.POST,
			middleware: options.middleware || [],
			pathMapper: options.pathMapper || defaultPathMapper,
			publishOptions: options.publishOptions || {
				eventName: avroSchema.name
			},
			responseWriter: options.responseWriter || defaultResponseWriter,
			schema: avroSchema,
			schemaName: getSchemaName(avroSchema),
			synchronous: options.synchronous || false
		};

		return validatedOptions;
	}

}
