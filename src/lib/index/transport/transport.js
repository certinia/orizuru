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
	avsc = require('avsc'),
	fs = require('fs-extra'),
	path = require('path'),

	PROPERTY_TRANSPORT_SCHEMA = 'compiledSchema';

/**
 * Class used to encode and decode messages using the transport schema.
 */
class Transport {

	/**
	 * Creates a new 'Transport' which can then be used to encode and decode messages.
	 * 
	 * @example
	 * const transport = new Transport();
	 * @returns {Transport} - Functions to encode and decode messages using the transport schema.
	 */
	constructor() {

		const
			schemaPath = path.resolve(__dirname, './transport.avsc'),
			transport = fs.readJsonSync(schemaPath),
			compiledSchema = avsc.Type.forSchema(transport);

		// Define the transport schema as a property.
		Object.defineProperty(this, PROPERTY_TRANSPORT_SCHEMA, { value: compiledSchema });

	}

	/**
	 * Decode a message using the transport schema.
	 * 
	 * @param {String} schema - The message schema.
	 * @param {String} content - The message contents.
	 */
	decode(schema, content) {

		const
			decompiledTransportObject = this[PROPERTY_TRANSPORT_SCHEMA].fromBuffer(content),

			compiledContextSchema = avsc.Type.forSchema(JSON.parse(decompiledTransportObject.contextSchema)),
			compiledWriterMessageSchema = avsc.Type.forSchema(JSON.parse(decompiledTransportObject.messageSchema)),

			resolver = schema.createResolver(compiledWriterMessageSchema),

			// Create plain objects from the AVSC types.
			context = Object.assign({},
				compiledContextSchema.fromBuffer(decompiledTransportObject.contextBuffer)),
			message = Object.assign({},
				schema.fromBuffer(decompiledTransportObject.messageBuffer, resolver));

		return { context, message };

	}

	/**
	 * Encode a message using the transport schema.
	 * 
	 * @param {String} schema - The message schema.
	 * @param {String} message - The message contents.
	 * @param {String} context - The message context.
	 */
	encode(schema, message, context = {}) {

		const
			compiledContextSchema = avsc.Type.forValue(context),
			transport = {
				contextSchema: JSON.stringify(compiledContextSchema),
				contextBuffer: compiledContextSchema.toBuffer(context),
				messageSchema: JSON.stringify(schema),
				messageBuffer: schema.toBuffer(message)
			};

		return this[PROPERTY_TRANSPORT_SCHEMA].toBuffer(transport);

	}

}

module.exports = Transport;
