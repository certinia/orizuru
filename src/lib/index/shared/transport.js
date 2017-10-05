'use strict';

const
	transport = require('./transport/schema'),
	{ compileFromPlainObject, compileFromSchemaDefinition } = require('./schema'),

	compiledTransportSchema = compileFromSchemaDefinition(transport),

	toBuffer = (compiledMessageSchema, message, context) => {
		const
			contextOrEmpty = context || {},
			compiledContextSchema = compileFromPlainObject(contextOrEmpty),
			transport = {
				contextSchema: JSON.stringify(compiledContextSchema.toJSON()),
				contextBuffer: compiledContextSchema.toBuffer(contextOrEmpty),
				messageSchema: JSON.stringify(compiledMessageSchema.toJSON()),
				messageBuffer: compiledMessageSchema.toBuffer(message)
			};
		return compiledTransportSchema.toBuffer(transport);
	},

	fromBuffer = (buffer) => {
		const
			decompiledTransportObject = compiledTransportSchema.fromBuffer(buffer),

			compiledContextSchema = compileFromSchemaDefinition(JSON.parse(decompiledTransportObject.contextSchema)),
			compiledMessageSchema = compileFromSchemaDefinition(JSON.parse(decompiledTransportObject.messageSchema)),

			context = compiledContextSchema.fromBuffer(decompiledTransportObject.contextBuffer),
			message = compiledMessageSchema.fromBuffer(decompiledTransportObject.messageBuffer);

		return { context, message };
	};

module.exports = {
	toBuffer,
	fromBuffer
};
