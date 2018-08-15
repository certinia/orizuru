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

import chai from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Options } from '../../../src';
import { SchemaValidator } from '../../../src/index/validator/shared/schema';

import { RouteValidator } from '../../../src/index/validator/route';

chai.use(sinonChai);

const expect = chai.expect;

describe('index/validator/route.ts', () => {

	let routeValidator: RouteValidator;

	beforeEach(() => {
		routeValidator = new RouteValidator();
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('validate', () => {

		it('should return the schema if it is valid', () => {

			// Given
			sinon.stub(SchemaValidator.prototype, 'validate');

			const input: Options.Route.IRaw = {
				schema: '{"name":"com.example.FullName","type":"record","fields":[]}'
			};

			// When
			const validated = routeValidator.validate(input);

			// Then
			expect(validated.endpoint).to.eql('/');
			expect(validated.method).to.eql('post');
			expect(validated.middleware).to.eql([]);
			expect(validated.pathMapper).to.be.a('function');
			expect(validated.responseWriter).to.be.a('function');
			expect(validated.schema).to.eql('{"name":"com.example.FullName","type":"record","fields":[]}');

		});

		describe('should throw an error', () => {

			it('if no config is provided', () => {

				// Given
				// When
				// Then
				expect(() => routeValidator.validate(undefined as any)).to.throw(/^Missing required object parameter\.$/);

			});

			it('if config is not an object', () => {

				// Given
				// When
				// Then
				expect(() => routeValidator.validate(2 as any)).to.throw(/^Invalid parameter: 2 is not an object\.$/);

			});

			it('if the endpoint is not a string', () => {

				// Given
				const config = {
					endpoint: 2
				};

				// When
				// Then
				expect(() => routeValidator.validate(config as any)).to.throw(/^Invalid parameter: endpoint is not a string\.$/);

			});

			it('if the method is not a string', () => {

				// Given
				const config = {
					method: 2
				};

				// When
				// Then
				expect(() => routeValidator.validate(config as any)).to.throw(/^Invalid parameter: method is not a string\.$/);

			});

			it('if the method is not a valid option', () => {

				// Given
				const config = {
					method: 'invalid'
				};

				// When
				// Then
				expect(() => routeValidator.validate(config as any)).to.throw(/^Invalid parameter: method must be one of the following options: delete,get,head,options,patch,post,put,trace\. Got invalid\.$/);

			});

			it('if the middleware is not an array', () => {

				// Given
				const config = {
					middleware: 2
				};

				// When
				// Then
				expect(() => routeValidator.validate(config as any)).to.throw(/^Invalid parameter: middleware is not an array\.$/);

			});

			it('if a middleware is not a function', () => {

				// Given
				const config = {
					middleware: [2]
				};

				// When
				// Then
				expect(() => routeValidator.validate(config as any)).to.throw(/^Invalid parameter: middleware\[0\] is not a function\.$/);

			});

			it('if the responseWriter is not a function', () => {

				// Given
				const config = {
					responseWriter: 2,
					schema: '{"name":"com.example.FullName","type":"record","fields":[]}'
				};

				// When
				// Then
				expect(() => routeValidator.validate(config as any)).to.throw(/^Invalid parameter: responseWriter is not a function\.$/);

			});

			it('if the pathMapper is not a function', () => {

				// Given
				const config = {
					pathMapper: 23,
					responseWriter: _.noop,
					schema: '{"name":"com.example.FullName","type":"record","fields":[]}'
				};

				// When
				// Then
				expect(() => routeValidator.validate(config as any)).to.throw(/^Invalid parameter: pathMapper is not a function\.$/);

			});

			it('if the schema is invalid', () => {

				// Given
				sinon.stub(SchemaValidator.prototype, 'validate').throws(new Error('invalid schema'));

				const config = {};

				// When
				// Then
				expect(() => routeValidator.validate(config as any)).to.throw(/^invalid schema$/);

			});

		});

	});

	describe('responseWriter', () => {

		it('should send a 400 status if the request fails', () => {

			// Given
			const config = {
				middleware: [_.noop],
				schema: '{"name":"com.example.FullName","type":"record","fields":[]}'
			};

			const validatedConfig = routeValidator.validate(config as any);

			const server = {
				error: sinon.stub()
			};

			const request = sinon.stub();

			const response = {
				send: sinon.stub().returnsThis(),
				status: sinon.stub().returnsThis()
			};

			// When
			validatedConfig.responseWriter(server as any)('error' as any, request as any, response as any);

			// Then
			expect(response.status).to.have.been.calledOnce;
			expect(response.status).to.have.been.calledWith(400);
			expect(response.send).to.have.been.calledOnce;
			expect(response.send).to.have.been.calledWith('error');

		});

		it('should send a 200 status if the request succeeds', () => {

			// Given
			const config = {
				schema: '{"name":"com.example.FullName","type":"record","fields":[]}'
			};

			const validatedConfig = routeValidator.validate(config as any);

			const server = {
				error: sinon.stub()
			};

			const request = sinon.stub();

			const response = {
				send: sinon.stub().returnsThis(),
				status: sinon.stub().returnsThis()
			};

			// When
			validatedConfig.responseWriter(server as any)(undefined, request as any, response as any);

			// Then
			expect(response.status).to.have.been.calledOnce;
			expect(response.status).to.have.been.calledWith(200);
			expect(response.send).to.have.been.calledOnce;
			expect(response.send).to.have.been.calledWith('Ok.');

		});

	});

});
