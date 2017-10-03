'use strict';

const
	_ = require('lodash'),

	SWAGGER_VERSION = '2.0',
	SCHEMA_VERSION = '1.0.0',
	SERVICE_TITLE = 'External Service',

	HTTPS = 'https',
	INPUT = 'application/json',
	OUTPUT = 'text/plain',
	STRING_TYPE = 'string',

	SLASH = '/',

	RESPONSE_OK = 'OK',
	RESPONSE_BAD_REQUEST = 'BAD_REQUEST',
	RESPONSE_UNAUTHORIZED = 'UNAUTHORIZED',

	defaultSchema = hostAddress => ({
		swagger: SWAGGER_VERSION,
		info: {
			version: SCHEMA_VERSION,
			title: SERVICE_TITLE
		},
		host: hostAddress,
		schemes: [HTTPS],
		consumes: [INPUT],
		produces: [OUTPUT],
		paths: {},
		definitions: {}
	}),

	defaultPathResponse = response => ({
		description: response,
		content: {
			[OUTPUT]: {
				schema: {
					type: STRING_TYPE,
					example: response
				}
			}
		}
	}),

	defaultPath = name => ({
		description: name,
		operationId: name,
		parameters: [],
		responses: {
			200: defaultPathResponse(RESPONSE_OK),
			400: defaultPathResponse(RESPONSE_BAD_REQUEST),
			401: defaultPathResponse(RESPONSE_UNAUTHORIZED)
		}
	}),

	convert = (schemaNameToDefinition, hostAddress, apiEndpoint) => {

		const
			schema = defaultSchema(hostAddress),
			{ paths } = schema;

		_.each(schemaNameToDefinition, (schema, name) => {

			const
				path = defaultPath(name),
				{ parameters } = path;


			paths[apiEndpoint + SLASH + name] = path;

		});

		return schema;
	};

return {
	convert
};
