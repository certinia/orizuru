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

import { AvroSchema } from '../../../src';

import { create } from '../../../src/index/server/route';

chai.use(sinonChai);

const expect = chai.expect;

describe('index/server/route', () => {

	afterEach(() => {
		sinon.restore();
	});

	describe('create', () => {

		it('should return a function', () => {

			// Given
			const server: any = sinon.stub();
			const schema: any = sinon.stub();
			const responseWriter: any = sinon.stub();
			const publishOptions: any = sinon.stub();

			// When
			const routeFunction = create(server, schema, responseWriter, publishOptions);

			// Then
			expect(routeFunction).to.be.a('function');

		});

		describe('should publish a message', () => {

			it('if the request orizuru property is set', async () => {

				// Given
				const server: any = {
					getPublisher: sinon.stub().returns({
						publish: sinon.stub().resolves()
					})
				};

				const publishOptions = {
					eventName: 'com.example.FullName'
				};

				const responseWriter = sinon.stub().returns(sinon.stub());

				const schema = avsc.Type.forSchema({
					fields: [
						{ name: 'first', type: 'string' },
						{ name: 'last', type: 'string' }
					],
					name: 'FullName',
					namespace: 'com.example',
					type: 'record'
				}) as AvroSchema;

				const routeFunction = create(server, schema, responseWriter, publishOptions);

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
				expect(responseWriter).to.have.been.calledOnce;
				expect(server.getPublisher().publish).to.have.been.calledWithExactly({
					message: {
						context: request.orizuru,
						message: request.body
					},
					publishOptions: {
						eventName: 'com.example.FullName'
					},
					schema
				});

			});

			it('if the request orizuru property is not set', async () => {

				// Given
				const server: any = {
					getPublisher: sinon.stub().returns({
						publish: sinon.stub().resolves()
					})
				};

				const publishOptions = {
					eventName: 'com.example.FullName'
				};

				const responseWriter = sinon.stub().returns(sinon.stub());

				const schema = avsc.Type.forSchema({
					fields: [
						{ name: 'first', type: 'string' },
						{ name: 'last', type: 'string' }
					],
					name: 'FullName',
					namespace: 'com.example',
					type: 'record'
				}) as AvroSchema;

				const routeFunction = create(server, schema, responseWriter, publishOptions);

				const request: any = {
					baseUrl: '/com/example',
					body: { something: 10 },
					params: {
						schemaName: 'FullName'
					}
				};

				const response: any = {
					send: sinon.stub().returnsThis(),
					status: sinon.stub().returnsThis()
				};

				// When
				await routeFunction(request, response);

				// Then
				expect(responseWriter).to.have.been.calledOnce;
				expect(server.getPublisher().publish).to.have.been.calledWithExactly({
					message: {
						context: {},
						message: request.body
					},
					publishOptions: {
						eventName: 'com.example.FullName'
					},
					schema
				});

			});

		});

		describe('should error', () => {

			it('if publishing the message rejects', async () => {

				// Given
				const expectedError = new Error('Failed to publish message');

				const server: any = {
					getPublisher: sinon.stub().returns({
						publish: sinon.stub().rejects(expectedError)
					})
				};

				const responseFunction = sinon.stub();

				const publishOptions = {
					eventName: 'com.example.FullName'
				};

				const responseWriter = sinon.stub().returns(responseFunction);

				const schema = avsc.Type.forSchema({
					fields: [
						{ name: 'first', type: 'string' },
						{ name: 'last', type: 'string' }
					],
					name: 'FullName',
					namespace: 'com.example',
					type: 'record'
				}) as AvroSchema;

				const routeFunction = create(server, schema, responseWriter, publishOptions);

				const request: any = {
					baseUrl: '/',
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
				expect(responseWriter).to.have.been.calledOnce;
				expect(responseFunction).to.have.been.calledOnce;
				expect(responseFunction).to.have.been.calledWithExactly(expectedError, request, response);

			});

			it('if publishing the message throws an error', async () => {

				// Given
				const expectedError = new Error('Failed to publish message');

				const server: any = {
					getPublisher: sinon.stub().returns({
						publish: sinon.stub().rejects(expectedError)
					})
				};

				const responseFunction = sinon.stub();

				const publishOptions = {
					eventName: 'com.example.FullName'
				};

				const responseWriter = sinon.stub().returns(responseFunction);

				const schema = avsc.Type.forSchema({
					fields: [
						{ name: 'first', type: 'string' },
						{ name: 'last', type: 'string' }
					],
					name: 'FullName',
					namespace: 'com.example',
					type: 'record'
				}) as AvroSchema;

				const routeFunction = create(server, schema, responseWriter, publishOptions);

				const request: any = {
					baseUrl: '/',
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
				expect(responseWriter).to.have.been.calledOnce;
				expect(responseFunction).to.have.been.calledOnce;
				expect(responseFunction).to.have.been.calledWithExactly(expectedError, request, response);

			});

		});

	});

});
