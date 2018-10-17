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

import avsc from 'avsc';
import chai from 'chai';

import { SchemaValidator } from '../../../../src/index/validator/shared/schema';

const expect = chai.expect;

describe('index/validator/shared/schema', () => {

	let schemaValidator: SchemaValidator;

	beforeEach(() => {
		schemaValidator = new SchemaValidator();
	});

	describe('constructor', () => {

		it('should return the schema if it is valid (string format)', () => {

			// Given
			const schema: string = '{"name":"com.example.FullName","type":"record","fields":[]}';

			// When
			const validatedSchema = schemaValidator.validate(schema);

			// Then
			expect(validatedSchema).to.be.an.instanceof(avsc.Type);

		});

		it('should return the schema if it is valid (JSON format)', () => {

			// Given
			const schema: any = {
				fields: [],
				name: 'com.example.FullName',
				type: 'record'
			};

			// When
			const validatedSchema = schemaValidator.validate(schema);

			// Then
			expect(validatedSchema).to.be.an.instanceof(avsc.Type);

		});

		it('should return the schema if it is valid (Compiled format)', () => {

			// Given
			const schema = avsc.Type.forSchema({
				fields: [],
				name: 'com.example.FullName',
				type: 'record'
			});

			// When
			const validatedSchema = schemaValidator.validate(schema);

			// Then
			expect(validatedSchema).to.be.an.instanceof(avsc.Type);

		});

		describe('should throw an error', () => {

			it('if no schema is provided', () => {

				// Given
				// When
				// Then
				expect(() => schemaValidator.validate(undefined)).to.throw(/^Missing required avro-schema parameter: schema\.$/);

			});

			it('if the avro schema is invalid', () => {

				// Given
				const schema: number = 2;

				// When
				// Then
				expect(() => schemaValidator.validate(schema)).to.throw(/^Invalid Avro Schema\. Unexpected value type: number\.$/);

			});

			it('if the avro schema JSON is invalid', () => {

				// Given
				const schema: string = '{"type":record","fields":[]}';

				// When
				// Then
				expect(() => schemaValidator.validate(schema)).to.throw(/^Invalid Avro Schema\. Failed to parse JSON string: {"type":record","fields":\[]\}\.$/);

			});

			it('if the avro schema is invalid', () => {

				// Given
				const schema: any = {
					name: 'com.example.FullName'
				};

				// When
				// Then
				expect(() => schemaValidator.validate(schema)).to.throw(/^Invalid Avro Schema\. Schema error: unknown type: undefined\.$/);

			});

			it('if the avro schema does not have a name property', () => {

				// Given
				const schema: string = '{"type":"record","fields":[]}';

				// When
				// Then
				expect(() => schemaValidator.validate(schema)).to.throw(/^Invalid Avro Schema\. Schema error: missing name property in schema: {"type":"record","fields":\[\]}\.$/);

			});

			it('if a nested avro schema does not have a name property', () => {

				// Given
				const schema: string = '{"name":"Test","type":"record","fields":[{"name":"TestRecord","type":{"type":"record","fields":[{"name":"teststring","type":"string"}]}}]}';

				// When
				// Then
				expect(() => schemaValidator.validate(schema)).to.throw(/^Invalid Avro Schema\. Schema error: missing name property in schema: {"type":"record","fields":\[{"name":"teststring","type":"string"}\]}\.$/);

			});

		});

	});

});
