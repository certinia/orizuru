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
	chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	avsc = require('avsc'),

	expect = chai.expect,

	route = require('../../../lib/index/server/route'),

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('index/server/route.js', () => {

	afterEach(() => {
		sandbox.restore();
	});

	describe('create', () => {

		it('should return a function', () => {

			// Given
			const
				server = sandbox.stub(),
				routeConfiguration = sandbox.stub(),
				responseWriter = sandbox.stub(),

				// When
				routeFunction = route.create(server, routeConfiguration, responseWriter);

			// Then
			expect(routeFunction).to.be.a('function');

		});

		it('should publish a message', () => {

			// Given
			const
				server = {
					publisher: {
						publish: sandbox.stub().resolves()
					}
				},
				routeConfiguration = {
					test: avsc.Type.forSchema({
						type: 'record',
						namespace: 'com.example',
						name: 'FullName',
						fields: [
							{ name: 'first', type: 'string' },
							{ name: 'last', type: 'string' }
						]
					})
				},
				responseWriter = sandbox.stub().returns(sandbox.stub()),

				routeFunction = route.create(server, routeConfiguration, responseWriter),

				request = {
					params: {
						schemaName: 'test'
					}
				},

				response = {
					status: sandbox.stub().returnsThis(),
					send: sandbox.stub().returnsThis()
				};

			// When
			// Then
			return expect(routeFunction(request, response))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(responseWriter).to.have.been.calledOnce;
				});

		});

		it('should error if a schema is not found for the request', () => {

			// Given
			const
				server = {
					error: sandbox.stub()
				},
				routeConfiguration = sandbox.stub(),
				responseWriter = sandbox.stub(),

				routeFunction = route.create(server, routeConfiguration, responseWriter),

				request = {
					params: {
						schemaName: 'test'
					}
				},
				response = {
					status: sandbox.stub().returnsThis(),
					send: sandbox.stub().returnsThis()
				};

			// When
			routeFunction(request, response);

			// Then
			expect(server.error).to.have.been.calledOnce;
			expect(server.error).to.have.been.calledWith('No schema for \'test\' found.');

		});

		it('should error if publishing the message fails', () => {

			// Given
			const
				expectedError = new Error('Failed to publish message'),
				server = {
					publisher: {
						publish: sandbox.stub().rejects(expectedError)
					}
				},
				routeConfiguration = {
					test: avsc.Type.forSchema({
						type: 'record',
						namespace: 'com.example',
						name: 'FullName',
						fields: [
							{ name: 'first', type: 'string' },
							{ name: 'last', type: 'string' }
						]
					})
				},
				responseFunction = sandbox.stub(),
				responseWriter = sandbox.stub().returns(responseFunction),

				routeFunction = route.create(server, routeConfiguration, responseWriter),

				request = {
					params: {
						schemaName: 'test'
					}
				},

				response = {
					status: sandbox.stub().returnsThis(),
					send: sandbox.stub().returnsThis()
				};

			// When
			// Then
			return expect(routeFunction(request, response))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(responseWriter).to.have.been.calledOnce;
					expect(responseFunction).to.have.been.calledOnce;
					expect(responseFunction).to.have.been.calledWith(expectedError);
				});

		});

	});

});
