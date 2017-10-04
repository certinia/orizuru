'use strict';

const
	transport = require('./transport/schema'),
	{ schemaForType, schemaForJson } = require('./schema'),
	transportSchema = schemaForJson(transport),

	toTransport = (bodySchema, bodyObject, metaObject) => {
		const
			nozomi = metaObject || {},
			nozomiSchema = schemaForType(nozomi),
			message = {
				nozomiSchema: JSON.stringify(nozomiSchema.toJSON()),
				nozomiBuffer: nozomiSchema.toBuffer(nozomi),
				bodySchema: JSON.stringify(bodySchema.toJSON()),
				bodyBuffer: bodySchema.toBuffer(bodyObject)
			};
		return transportSchema.toBuffer(message);
	},

	fromTransport = (buffer) => {
		const
			transportObject = transportSchema.fromBuffer(buffer),
			metaSchema = schemaForJson(JSON.parse(transportObject.nozomiSchema)),
			bodySchema = schemaForJson(JSON.parse(transportObject.bodySchema)),
			nozomi = metaSchema.fromBuffer(transportObject.nozomiBuffer),
			body = bodySchema.fromBuffer(transportObject.bodyBuffer);

		return { nozomi, body };
	};

module.exports = {
	toTransport,
	fromTransport
};
