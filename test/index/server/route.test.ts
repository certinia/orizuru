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
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import avsc from 'avsc';

import { create } from '../../../src/index/server/route';

chai.use(sinonChai);

const expect = chai.expect;

describe('index/server/route.ts', () => {

	afterEach(() => {
		sinon.restore();
	});

	describe('create', () => {

		it('should return a function', () => {

			// Given
			const server: any = sinon.stub();
			const routeConfiguration: any = sinon.stub();
			const options: any = {
				responseWriter: sinon.stub()
			};

			// When
			const routeFunction = create(server, routeConfiguration, options);

			// Then
			expect(routeFunction).to.be.a('function');

		});

		it('should publish a message', async () => {

			// Given
			const server: any = {
				getPublisher: sinon.stub().returns({
					publish: sinon.stub().resolves()
				})
			};

			const routeConfiguration = {
				test: avsc.Type.forSchema({
					fields: [
						{ name: 'first', type: 'string' },
						{ name: 'last', type: 'string' }
					],
					name: 'FullName',
					namespace: 'com.example',
					type: 'record'
				})
			};

			const options: any = {
				responseWriter: sinon.stub().returns(sinon.stub())
			};

			const routeFunction = create(server, routeConfiguration, options);

			const request: any = {
				body: { something: 10 },
				orizuru: {
					user: {
						username: 'test'
					}
				},
				params: {
					schemaName: 'test'
				}
			};

			const response: any = {
				send: sinon.stub().returnsThis(),
				status: sinon.stub().returnsThis()
			};

			// When
			await routeFunction(request, response);

			// Then
			expect(options.responseWriter).to.have.been.calledOnce;
			expect(server.getPublisher().publish).to.have.been.calledWith({
				message: {
					context: request.orizuru,
					message: request.body
				},
				publishOptions: {},
				schema: routeConfiguration.test
			});

		});

		it('should error if a schema is not found for the request', () => {

			// Given
			const server: any = {
				error: sinon.stub()
			};

			const routeConfiguration: any = sinon.stub();

			const options: any = {
				responseWriter: sinon.stub()
			};

			const routeFunction = create(server, routeConfiguration, options);

			const request: any = {
				params: {
					schemaName: 'test'
				}
			};

			const response: any = {
				send: sinon.stub().returnsThis(),
				status: sinon.stub().returnsThis()
			};

			// When
			routeFunction(request, response);

			// Then
			expect(server.error).to.have.been.calledOnce;
			expect(server.error).to.have.been.calledWith('No schema for \'test\' found.');

		});

		it('should error if publishing the message rejects', async () => {

			// Given
			const expectedError = new Error('Failed to publish message');

			const server: any = {
				getPublisher: sinon.stub().returns({
					publish: sinon.stub().rejects(expectedError)
				})
			};

			const routeConfiguration = {
				test: avsc.Type.forSchema({
					fields: [
						{ name: 'first', type: 'string' },
						{ name: 'last', type: 'string' }
					],
					name: 'FullName',
					namespace: 'com.example',
					type: 'record'
				})
			};

			const responseFunction = sinon.stub();

			const options: any = {
				responseWriter: sinon.stub().returns(responseFunction)
			};

			const routeFunction = create(server, routeConfiguration, options);

			const request: any = {
				params: {
					schemaName: 'test'
				}
			};

			const response: any = {
				send: sinon.stub().returnsThis(),
				status: sinon.stub().returnsThis()
			};

			// When
			await routeFunction(request, response);

			// Then
			expect(options.responseWriter).to.have.been.calledOnce;
			expect(responseFunction).to.have.been.calledOnce;
			expect(responseFunction).to.have.been.calledWith(expectedError);

		});

		it('should error if publishing the message throws an error', async () => {

			// Given
			const expectedError = new Error('Failed to publish message');

			const server: any = {
				getPublisher: sinon.stub().returns({
					publish: sinon.stub().rejects(expectedError)
				})
			};

			const routeConfiguration = {
				test: avsc.Type.forSchema({
					fields: [
						{ name: 'first', type: 'string' },
						{ name: 'last', type: 'string' }
					],
					name: 'FullName',
					namespace: 'com.example',
					type: 'record'
				})
			};

			const responseFunction = sinon.stub();

			const options: any = {
				responseWriter: sinon.stub().returns(responseFunction)
			};

			const routeFunction = create(server, routeConfiguration, options);

			const request: any = {
				params: {
					schemaName: 'test'
				}
			};

			const response: any = {
				send: sinon.stub().returnsThis(),
				status: sinon.stub().returnsThis()
			};

			// When
			await routeFunction(request, response);

			// Then
			expect(options.responseWriter).to.have.been.calledOnce;
			expect(responseFunction).to.have.been.calledOnce;
			expect(responseFunction).to.have.been.calledWith(expectedError);

		});

	});

});
