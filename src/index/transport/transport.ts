/**
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

import { ForSchemaOptions, Schema, Type } from 'avsc';
import { readJsonSync } from 'fs-extra';
import { resolve } from 'path';
import { IOrizuruMessage } from '../..';

/**
 * Class used to encode and decode messages using the transport schema.
 * @private
 */
export class Transport {

	private readonly compiledSchema: Type;

	/**
	 * Creates a new 'Transport' which can then be used to encode and decode messages.
	 */
	constructor() {

		const schemaPath = resolve(__dirname, './transport.avsc');
		const transport = readJsonSync(schemaPath);

		// Define the transport schema as a property.
		this.compiledSchema = Type.forSchema(transport);

	}

	/**
	 * Decode a message using the transport schema.
	 */
	public decode<C extends Orizuru.Context, M extends Orizuru.Message>(schema: Type, content: Buffer): IOrizuruMessage<C, M> {

		const decompiledTransportObject: any = this.compiledSchema.fromBuffer(content);

		const compiledContextSchema = Type.forSchema(JSON.parse(decompiledTransportObject.contextSchema));
		const compiledWriterMessageSchema = Type.forSchema(JSON.parse(decompiledTransportObject.messageSchema));

		const resolver = schema.createResolver(compiledWriterMessageSchema);

		// Create plain objects from the AVSC types.
		const context: C = Object.assign({}, compiledContextSchema.fromBuffer(decompiledTransportObject.contextBuffer));
		const message: M = Object.assign({}, schema.fromBuffer(decompiledTransportObject.messageBuffer, resolver));

		return { context, message };

	}

	/**
	 * Encode a message using the transport schema.
	 */
	public encode<C extends Orizuru.Context, M extends Orizuru.Message>(schema: Type, { context, message }: IOrizuruMessage<C, M>) {

		const validatedContextSchema = this.getContextSchema(context);

		const transport = {
			contextBuffer: validatedContextSchema.toBuffer(context),
			contextSchema: JSON.stringify(validatedContextSchema),
			messageBuffer: schema.toBuffer(message),
			messageSchema: JSON.stringify(schema)
		};

		return this.compiledSchema.toBuffer(transport);

	}

	private getContextSchema(context: any) {

		const compiledContextSchema = Type.forValue(context, {
			typeHook: this.getTypeHook()
		});

		// Validate that the schema has no anonymous types
		return Type.forSchema(compiledContextSchema, {
			noAnonymousTypes: true
		});

	}

	private getTypeHook(): (schema: Schema, opts: ForSchemaOptions) => Type {

		let i = 1;
		return (schema: any) => {
			if (schema.type && (schema.type === 'enum' || schema.type === 'fixed' || schema.type === 'record') && !schema.name) {
				schema.namespace = 'com.financialforce.orizuru';
				schema.name = `Context${i}`;
				i++;
			}
			return Type.forSchema(schema);
		};
	}

}
