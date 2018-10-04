/**
 * Copyright (c) 2018, FinancialForce.com, inc
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
import request from 'supertest';

import { Transport } from '@financialforcedev/orizuru-transport-rabbitmq';

import { Handler, IOrizuruMessage, ITransport, json, Server } from '../src';

const expect = chai.expect;

describe('RabbitMQ handler', () => {

	let handlerTransport: ITransport;
	let server: Server;
	let app: any;

	beforeEach(() => {

		const serverTransport = new Transport({
			url: 'amqp://localhost'
		});

		handlerTransport = new Transport({
			prefetch: 1,
			url: 'amqp://localhost'
		});

		server = new Server({
			port: 8080,
			transport: serverTransport
		});

	});

	afterEach(async () => {
		await handlerTransport.close();
		await server.close();
	});

	describe('API defined within Avro schema', () => {

		let schema1: any;
		let schema2: any;

		beforeEach(async () => {

			schema1 = {
				fields: [{
					name: 'id',
					type: 'string'
				}],
				name: 'test',
				namespace: 'api',
				type: 'record'
			};

			schema2 = {
				fields: [{
					name: 'id',
					type: 'string'
				}],
				name: 'test2',
				namespace: 'api',
				type: 'record'
			};

			server.addRoute({
				middleware: [
					json()
				],
				schema: schema1
			});

			server.addRoute({
				middleware: [
					json()
				],
				schema: schema2
			});

			app = await server.listen();

		});

		it('should consume messages from the correct queue', async () => {

			// Given
			await request(app)
				.post('/api/test')
				.send({
					id: 'testId'
				})
				.expect(200);

			const handler = new Handler({
				transport: handlerTransport
			});

			await handler.init();

			// When
			const testMessage = await new Promise((resolve) => {

				const handlerFunc = async (message: IOrizuruMessage<any, any>) => {
					resolve(message);
				};

				handler.handle({
					handler: handlerFunc,
					schema: schema1,
					subscribeOptions: {
						eventName: 'api.test'
					}
				});

			});

			// Then
			expect(testMessage).to.eql({
				context: {},
				message: {
					id: 'testId'
				}
			});

		});

		it('should consume messages from the correct queues', async () => {

			// Given
			await request(app)
				.post('/api/test')
				.send({
					id: 'testId'
				})
				.expect(200);

			await request(app)
				.post('/api/test2')
				.send({
					id: 'testId2'
				})
				.expect(200);

			const handler = new Handler({
				transport: handlerTransport
			});

			await handler.init();

			// When
			const testMessages = await new Promise((resolve) => {

				const messages: any = [];

				const handlerFunc1 = async (message: IOrizuruMessage<any, any>) => {
					messages.push(message);
					if (messages.length === 2) {
						resolve(messages);
					}
				};

				const handlerFunc2 = async (message: IOrizuruMessage<any, any>) => {
					messages.push(message);
					if (messages.length === 2) {
						resolve(messages);
					}
				};

				return Promise.all([
					handler.handle({
						handler: handlerFunc1,
						schema: schema1,
						subscribeOptions: {
							eventName: 'api.test'
						}
					}),
					handler.handle({
						handler: handlerFunc2,
						schema: schema2,
						subscribeOptions: {
							eventName: 'api.test2'
						}
					})
				]);

			});

			// Then
			expect(testMessages).to.deep.include.members([{
				context: {},
				message: {
					id: 'testId'
				}
			}]);
			expect(testMessages).to.deep.include.members([{
				context: {},
				message: {
					id: 'testId2'
				}
			}]);

		});

	});

});
