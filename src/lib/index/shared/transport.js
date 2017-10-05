'use strict';

const
	transport = require('./transport/schema'),
	{ compileFromPlainObject, compileFromSchemaDefinition } = require('./schema'),

	compiledTransportSchema = compileFromSchemaDefinition(transport),

	toBuffer = (compiledTypedSchema, typed, untyped) => {
		const
			untypedOrEmpty = untyped || {},
			compiledUntypedSchema = compileFromPlainObject(untypedOrEmpty),
			message = {
				untypedSchema: JSON.stringify(compiledUntypedSchema.toJSON()),
				untypedBuffer: compiledUntypedSchema.toBuffer(untypedOrEmpty),
				typedSchema: JSON.stringify(compiledTypedSchema.toJSON()),
				typedBuffer: compiledTypedSchema.toBuffer(typed)
			};
		return compiledTransportSchema.toBuffer(message);
	},

	fromBuffer = (buffer) => {
		const
			decompiledTransportObject = compiledTransportSchema.fromBuffer(buffer),

			compiledUntypedSchema = compileFromSchemaDefinition(JSON.parse(decompiledTransportObject.untypedSchema)),
			compiledTypedSchema = compileFromSchemaDefinition(JSON.parse(decompiledTransportObject.typedSchema)),

			untyped = compiledUntypedSchema.fromBuffer(decompiledTransportObject.untypedBuffer),
			typed = compiledTypedSchema.fromBuffer(decompiledTransportObject.typedBuffer);

		return { untyped, typed };
	};

module.exports = {
	toBuffer,
	fromBuffer
};
