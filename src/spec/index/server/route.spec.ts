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

import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import avsc from 'avsc';

import { create } from '../../../lib/index/server/route';
import { Server } from '../../../lib';

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('index/server/route.js', () => {

	afterEach(() => {
		sinon.restore(sinon);
	});

	describe('create', () => {

		it('should return a function', () => {

			// Given
			const
				server = sinon.stub(),
				routeConfiguration = sinon.stub(),
				responseWriter = sinon.stub(),

				// When
				routeFunction = create(<any>server, routeConfiguration, responseWriter);

			// Then
			expect(routeFunction).to.be.a('function');

		});

		it('should publish a message', () => {

			// Given
			const
				server = {
					publisher: {
						publish: sinon.stub().resolves()
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
				responseWriter = sinon.stub().returns(sinon.stub()),

				routeFunction = create(<any>server, routeConfiguration, responseWriter),

				request = {
					params: {
						schemaName: 'test'
					},
					body: { something: 10 },
					orizuru: {
						user: {
							username: 'test'
						}
					}
				},

				response = {
					status: sinon.stub().returnsThis(),
					send: sinon.stub().returnsThis()
				};

			// When
			// Then
			return expect(routeFunction(<any>request, <any>response))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(responseWriter).to.have.been.calledOnce;
					expect(server.publisher.publish).to.have.been.calledWith({
						schema: routeConfiguration.test,
						message: request.body,
						context: request.orizuru,
						config: {}
					});
				});

		});

		it('should error if a schema is not found for the request', () => {

			// Given
			const
				server = {
					error: sinon.stub()
				},
				routeConfiguration = sinon.stub(),
				responseWriter = sinon.stub(),

				routeFunction = create(<any>server, routeConfiguration, responseWriter),

				request = {
					params: {
						schemaName: 'test'
					}
				},
				response = {
					status: sinon.stub().returnsThis(),
					send: sinon.stub().returnsThis()
				};

			// When
			routeFunction(<any>request, <any>response);

			// Then
			expect(server.error).to.have.been.calledOnce;
			expect(server.error).to.have.been.calledWith('No schema for \'test\' found.');

		});

		it('should error if publishing the message rejects', () => {

			// Given
			const
				expectedError = new Error('Failed to publish message'),
				server = {
					publisher: {
						publish: sinon.stub().rejects(expectedError)
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
				responseFunction = sinon.stub(),
				responseWriter = sinon.stub().returns(responseFunction),

				routeFunction = create(<any>server, routeConfiguration, responseWriter),

				request = {
					params: {
						schemaName: 'test'
					}
				},

				response = {
					status: sinon.stub().returnsThis(),
					send: sinon.stub().returnsThis()
				};

			// When
			// Then
			return expect(routeFunction(<any>request, <any>response))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(responseWriter).to.have.been.calledOnce;
					expect(responseFunction).to.have.been.calledOnce;
					expect(responseFunction).to.have.been.calledWith(expectedError);
				});

		});

		it('should error if publishing the message throws an error', () => {

			// Given
			const
				expectedError = new Error('Failed to publish message'),
				server = {
					publisher: {
						publish: sinon.stub().throws(expectedError)
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
				responseFunction = sinon.stub(),
				responseWriter = sinon.stub().returns(responseFunction),

				routeFunction = create(<any>server, routeConfiguration, responseWriter),

				request = {
					params: {
						schemaName: 'test'
					}
				},

				response = {
					status: sinon.stub().returnsThis(),
					send: sinon.stub().returnsThis()
				};

			// When
			// Then
			return expect(routeFunction(<any>request, <any>response))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(responseWriter).to.have.been.calledOnce;
					expect(responseFunction).to.have.been.calledOnce;
					expect(responseFunction).to.have.been.calledWith(expectedError);
				});

		});

	});

});
