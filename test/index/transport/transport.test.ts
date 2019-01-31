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

import avsc from 'avsc';
import chai from 'chai';
import fs from 'fs-extra';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Transport } from '../../../src/index/transport/transport';

chai.use(sinonChai);

const expect = chai.expect;
const transportSchema = fs.readJsonSync(__dirname + '/../../../src/index/transport/transport.avsc');

describe('index/transport/transport', () => {

	const messageSchemaV1 = avsc.Type.forSchema({
		fields: [
			{ name: 'name', type: 'string' },
			{ name: 'favorite_number', type: 'int' }
		],
		name: 'user',
		namespace: 'example.avro',
		type: 'record'
	});

	const messageSchemaV2 = avsc.Type.forSchema({
		fields: [
			{ name: 'name', type: 'string' },
			{ name: 'favorite_color', type: 'string', ['default']: 'green' },
			{ name: 'favorite_number', type: 'int' }
		],
		name: 'user',
		namespace: 'example.avro',
		type: 'record'
	});

	const messageV1 = {
		name: 'Bob',
		['favorite_number']: 10
	};

	const messageV2 = {
		name: 'Bob',
		['favorite_color']: 'blue',
		['favorite_number']: 10
	};

	const context = {
		test: 'A'
	};

	const contextSchema = avsc.Type.forSchema({
		fields: [{
			name: 'test',
			type: 'string'
		}],
		name: 'Context1',
		namespace: 'com.financialforce.orizuru',
		type: 'record'
	});

	const transportContentsV1 = {
		contextBuffer: contextSchema.toBuffer(context),
		contextSchema: JSON.stringify(contextSchema),
		messageBuffer: messageSchemaV1.toBuffer(messageV1),
		messageSchema: JSON.stringify(messageSchemaV1)
	};

	const transportContentsV2 = {
		contextBuffer: contextSchema.toBuffer(context),
		contextSchema: JSON.stringify(contextSchema),
		messageBuffer: messageSchemaV2.toBuffer(messageV2),
		messageSchema: JSON.stringify(messageSchemaV2)
	};

	const compiledTransportSchema = avsc.Type.forSchema(transportSchema);

	afterEach(() => {
		sinon.restore();
	});

	describe('constructor', () => {

		it('should read the transport schema and store it in a property', () => {

			// Given
			sinon.stub(fs, 'readJsonSync').returns(JSON.parse('{"namespace":"com.ffdc.orizuru.transport","name":"Transport","type":"record","fields":[{"name":"contextSchema","type":"string"},{"name":"contextBuffer","type":"bytes"},{"name":"messageSchema","type":"string"},{"name":"messageBuffer","type":"bytes"}]}'));
			sinon.stub(avsc.Type, 'forSchema');

			// When
			const transport = new Transport();

			// Then
			expect(fs.readJsonSync).to.have.been.calledOnce;
			expect(avsc.Type.forSchema).to.have.been.calledOnce;
			expect(transport).to.have.property('compiledSchema');

		});

	});

	describe('encode', () => {

		it('should write the correct data (with context)', () => {

			// Given
			const transport = new Transport();

			// When
			// Then
			expect(transport.encode(messageSchemaV1, { message: messageV1, context })).to.eql(compiledTransportSchema.toBuffer(transportContentsV1));

		});

	});

	describe('decode', () => {

		it('should read the correct data with the same schema', () => {

			// Given
			const transport = new Transport();

			const expected = { context, message: messageV1 };

			// When
			const result = transport.decode(messageSchemaV1, compiledTransportSchema.toBuffer(transportContentsV1));

			// Then
			expect(result).to.deep.equal(expected);

		});

		it('should be backward compatible', () => {

			// Given
			const transport = new Transport();

			const expected = {
				context,
				message: {
					name: 'Bob',
					['favorite_color']: 'green',
					['favorite_number']: 10
				}
			};

			// When
			const result = transport.decode(messageSchemaV2, compiledTransportSchema.toBuffer(transportContentsV1));

			// Then
			expect(result).to.deep.equal(expected);

		});

		it('should be forward compatible', () => {

			// Given
			const transport = new Transport();

			const expected = {
				context,
				message: {
					name: 'Bob',
					['favorite_number']: 10
				}
			};

			// When
			const result = transport.decode(messageSchemaV1, compiledTransportSchema.toBuffer(transportContentsV2));

			// Then
			expect(result).to.deep.equal(expected);

		});

	});

});
