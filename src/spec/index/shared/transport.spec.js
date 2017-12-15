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
	root = require('app-root-path'),

	chai = require('chai'),
	{ expect } = chai,

	{ compileFromPlainObject, compileFromSchemaDefinition } = require(root + '/src/lib/index/shared/schema'),

	transportSchema = require(root + '/src/lib/index/shared/transport/schema'),
	transport = require(root + '/src/lib/index/shared/transport');

describe('index/shared/transport.js', () => {

	const
		messageSchemaV1 = compileFromSchemaDefinition({
			namespace: 'example.avro',
			type: 'record',
			name: 'user',
			fields: [
				{ name: 'name', type: 'string' },
				{ name: 'favorite_number', type: 'int' }
			]
		}),
		messageSchemaV2 = compileFromSchemaDefinition({
			namespace: 'example.avro',
			type: 'record',
			name: 'user',
			fields: [
				{ name: 'name', type: 'string' },
				{ name: 'favorite_color', type: 'string', ['default']: 'green' },
				{ name: 'favorite_number', type: 'int' }
			]
		}),
		messageV1 = {
			name: 'Bob',
			['favorite_number']: 10
		},
		messageV2 = {
			name: 'Bob',
			['favorite_color']: 'blue',
			['favorite_number']: 10
		},
		context = {
			test: 'A'
		},
		contextSchema = compileFromPlainObject(context),
		transportContentsV1 = {
			contextSchema: JSON.stringify(contextSchema),
			contextBuffer: contextSchema.toBuffer(context),
			messageSchema: JSON.stringify(messageSchemaV1),
			messageBuffer: messageSchemaV1.toBuffer(messageV1)
		},
		transportContentsV2 = {
			contextSchema: JSON.stringify(contextSchema),
			contextBuffer: contextSchema.toBuffer(context),
			messageSchema: JSON.stringify(messageSchemaV2),
			messageBuffer: messageSchemaV2.toBuffer(messageV2)
		},
		compiledTransportSchema = compileFromSchemaDefinition(transportSchema);

	describe('toBuffer', () => {

		it('writes the correct data', () => {

			// Given
			// When
			// Then

			expect(transport.toBuffer(messageSchemaV1, messageV1, context))
				.to.eql(compiledTransportSchema.toBuffer(transportContentsV1));
		});

	});

	describe('fromBuffer', () => {

		it('reads the correct data with the same schema', () => {

			// Given
			// When

			const
				result = transport.fromBuffer(compiledTransportSchema.toBuffer(transportContentsV1), messageSchemaV1),
				expected = { context, message: messageV1 };

			// Then

			expect(result)
				.to.deep.equal(expected);
		});

		it('is backward compatible', () => {

			// Given
			// When

			const
				result = transport.fromBuffer(compiledTransportSchema.toBuffer(transportContentsV1), messageSchemaV2),
				expected = {
					context,
					message: {
						name: 'Bob',
						['favorite_color']: 'green',
						['favorite_number']: 10
					}
				};

			// Then

			expect(result)
				.to.deep.equal(expected);
		});

		it('is forward compatible', () => {

			// Given
			// When

			const
				result = transport.fromBuffer(compiledTransportSchema.toBuffer(transportContentsV2), messageSchemaV1),
				expected = {
					context,
					message: {
						name: 'Bob',
						['favorite_number']: 10
					}
				};

			// Then

			expect(result)
				.to.deep.equal(expected);
		});

	});

});
