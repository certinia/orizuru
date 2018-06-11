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
 **/

'use strict';

const
	_ = require('lodash'),
	avsc = require('avsc'),
	chai = require('chai'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect,

	RouteValidator = require('../../../lib/index/validator/route');

chai.use(sinonChai);

describe('index/validator/route.js', () => {

	let routeValidator;

	beforeEach(() => {
		routeValidator = new RouteValidator();
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('constructor', () => {

		it('should return the schema if it is valid (string format)', () => {

			// Given
			const config = {
				schema: '{"name":"com.example.FullName","type":"record","fields":[]}'
			};

			// When
			// Then
			expect(routeValidator.validate(config)).to.eql(config);

		});

		it('should return the schema if it is valid (JSON format)', () => {

			// Given
			const config = {
				schema: {
					name: 'com.example.FullName',
					type: 'record',
					fields: []
				}
			};

			// When
			// Then
			expect(routeValidator.validate(config)).to.eql(config);

		});

		it('should return the schema if it is valid (Compiled format)', () => {

			// Given
			const config = {
				schema: avsc.Type.forSchema({
					name: 'com.example.FullName',
					type: 'record',
					fields: []
				})
			};

			// When
			// Then
			expect(routeValidator.validate(config)).to.eql(config);

		});

		it('should return the schema if pathMapper is a function', () => {

			// Given
			const config = {
				schema: avsc.Type.forSchema({
					name: 'com.example.FullName',
					type: 'record',
					fields: []
				}),
				pathMapper: _.noop
			};

			// When
			// Then
			expect(routeValidator.validate(config)).to.eql(config);

		});

		describe('should throw an error', () => {

			it('if no config is provided', () => {

				// Given
				// When
				// Then
				expect(() => routeValidator.validate()).to.throw(/^Missing required object parameter\.$/);

			});

			it('if config is not an object', () => {

				// Given
				// When
				// Then
				expect(() => routeValidator.validate(2)).to.throw(/^Invalid parameter: 2 is not an object\.$/);

			});

			it('if the endpoint is not a string', () => {

				// Given
				const config = {
					endpoint: 2
				};

				// When
				// Then
				expect(() => routeValidator.validate(config)).to.throw(/^Invalid parameter: endpoint is not a string\.$/);

			});

			it('if the method is not a string', () => {

				// Given
				const config = {
					method: 2
				};

				// When
				// Then
				expect(() => routeValidator.validate(config)).to.throw(/^Invalid parameter: method is not a string\.$/);

			});

			it('if the method is not a valid option', () => {

				// Given
				const config = {
					method: 'invalid'
				};

				// When
				// Then
				expect(() => routeValidator.validate(config)).to.throw(/^Invalid parameter: method must be one of the following options: checkout,copy,delete,get,head,lock,merge,mkactivity,mkcol,move,m-search,notify,options,patch,post,purge,put,report,search,subscribe,trace,unlock,unsubscribe\. Got invalid\.$/);

			});

			it('if the middleware is not an array', () => {

				// Given
				const config = {
					middleware: 2
				};

				// When
				// Then
				expect(() => routeValidator.validate(config)).to.throw(/^Invalid parameter: middleware is not an array\.$/);

			});

			it('if a middleware is not a function', () => {

				// Given
				const config = {
					middleware: [2]
				};

				// When
				// Then
				expect(() => routeValidator.validate(config)).to.throw(/^Invalid parameter: middleware\[0\] is not a function\.$/);

			});

			it('if no schema is provided', () => {

				// Given
				const config = {};

				// When
				// Then
				expect(() => routeValidator.validate(config)).to.throw(/^Missing required avro-schema parameter: schema\.$/);

			});

			it('if the avro schema is invalid', () => {

				// Given
				const config = {
					schema: 2
				};

				// When
				// Then
				expect(() => routeValidator.validate(config)).to.throw(/^Invalid Avro Schema\. Unexpected value type: number\.$/);

			});

			it('if the avro schema JSON is invalid', () => {

				// Given
				const config = {
					schema: '{"type":record","fields":[]}'
				};

				// When
				// Then
				expect(() => routeValidator.validate(config)).to.throw(/^Invalid Avro Schema\. Failed to parse JSON string: {"type":record","fields":\[]\}\.$/);

			});

			it('if the avro schema is invalid', () => {

				// Given
				const config = {
					schema: {
						name: 'com.example.FullName'
					}
				};

				// When
				// Then
				expect(() => routeValidator.validate(config)).to.throw(/^Invalid Avro Schema\. Schema error: unknown type: undefined\.$/);

			});

			it('if the avro schema does not have a name property', () => {

				// Given
				const config = {
					schema: '{"type":"record","fields":[]}'
				};

				// When
				// Then
				expect(() => routeValidator.validate(config)).to.throw(/^Missing required string parameter: schema\[name\]\.$/);

			});

			it('if the responseWriter is not a function', () => {

				// Given
				const config = {
					schema: '{"name":"com.example.FullName","type":"record","fields":[]}',
					responseWriter: 2
				};

				// When
				// Then
				expect(() => routeValidator.validate(config)).to.throw(/^Invalid parameter: responseWriter is not a function\.$/);

			});

			it('if the pathMapper is not a function', () => {

				// Given
				const config = {
					schema: '{"name":"com.example.FullName","type":"record","fields":[]}',
					responseWriter: _.noop,
					pathMapper: 23
				};

				// When
				// Then
				expect(() => routeValidator.validate(config)).to.throw(/^Invalid parameter: pathMapper is not a function\.$/);

			});

		});

	});

	describe('responseWriter', () => {

		it('should send a 400 status if the request fails', () => {

			// Given
			const
				config = {
					schema: '{"name":"com.example.FullName","type":"record","fields":[]}',
					middleware: [_.noop]
				},
				validatedConfig = routeValidator.validate(config),
				server = {
					error: sinon.stub()
				},
				request = sinon.stub(),
				response = {
					status: sinon.stub().returnsThis(),
					send: sinon.stub().returnsThis()
				};

			// When
			validatedConfig.responseWriter(server)('error', request, response);

			// Then
			expect(response.status).to.have.been.calledOnce;
			expect(response.status).to.have.been.calledWith(400);
			expect(response.send).to.have.been.calledOnce;
			expect(response.send).to.have.been.calledWith('error');

		});

		it('should send a 200 status if the request succeeds', () => {

			// Given
			const
				config = {
					schema: '{"name":"com.example.FullName","type":"record","fields":[]}'
				},
				validatedConfig = routeValidator.validate(config),
				server = {
					error: sinon.stub()
				},
				request = sinon.stub(),
				response = {
					status: sinon.stub().returnsThis(),
					send: sinon.stub().returnsThis()
				};

			// When
			validatedConfig.responseWriter(server)(undefined, request, response);

			// Then
			expect(response.status).to.have.been.calledOnce;
			expect(response.status).to.have.been.calledWith(200);
			expect(response.send).to.have.been.calledOnce;
			expect(response.send).to.have.been.calledWith('Ok.');

		});

	});

});
