/**
 * Copyright (c) 2018-2019, FinancialForce.com, inc
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

import axios, { AxiosResponse } from 'axios';

import { Transport } from '@financialforcedev/orizuru-transport-rabbitmq';

import { ITransport, json, Server } from '../src';

const expect = chai.expect;

function payloadMessage(expectedPayload: string, response: AxiosResponse) {
	const expected = Buffer.from(expectedPayload, 'base64').toString();
	const actual = Buffer.from(response.data[0].payload, 'base64').toString();
	return `\nexpected ${expected}\nactual ${actual}\nraw`;
}

describe('RabbitMQ server', () => {

	let server: Server;
	let transport: ITransport;
	let app: any;

	beforeEach(() => {

		transport = new Transport({
			url: 'amqp://localhost'
		});

		server = new Server({
			port: 8080,
			transport
		});

	});

	afterEach(async () => {
		await server.close();
	});

	describe('Synchronous API', () => {

		describe('get request', () => {

			beforeEach(async () => {

				server.addRoute({
					method: 'get',
					middleware: [
						json()
					],
					schema: {
						fields: [{
							name: 'id',
							type: 'string'
						}],
						name: 'test',
						namespace: 'api',
						type: 'record'
					},
					synchronous: true
				});

				app = await server.listen();

			});

			it('should return a 400 if the message is invalid', async () => {

				// Given
				// When
				const response = await request(app)
					.get('/api/test')
					.send({})
					.expect(400);

				// Then
				expect(response.body).to.eql({
					error: 'Error validating message for schema (api.test)\nInvalid value (undefined) for path (id) it should be of type (string)'
				});

			});

			it('should return 200 if the message is valid', async () => {

				// Given
				// When
				// Then
				await request(app)
					.get('/api/test')
					.send({
						id: '​​​​​0A9A874B658EAAD9A2​​​​​'
					})
					.expect(200);

			});

		});

		describe('post request', () => {

			beforeEach(async () => {

				server.addRoute({
					middleware: [
						json()
					],
					schema: {
						fields: [{
							name: 'id',
							type: 'string'
						}],
						name: 'test',
						namespace: 'api',
						type: 'record'
					},
					synchronous: true
				});

				app = await server.listen();

			});

			it('should return a 400 if the message is invalid', async () => {

				// Given
				// When
				const response = await request(app)
					.post('/api/test')
					.send({})
					.expect(400);

				// Then
				expect(response.body).to.eql({
					error: 'Error validating message for schema (api.test)\nInvalid value (undefined) for path (id) it should be of type (string)'
				});

			});

			it('should return 200 if the message is valid', async () => {

				// Given
				// When
				// Then
				await request(app)
					.post('/api/test')
					.send({
						id: '​​​​​917A48E336A50DCCFF​​​​​'
					})
					.expect(200);

			});

		});

	});

	describe('API defined within Avro schema', () => {

		beforeEach(async () => {

			server.addRoute({
				middleware: [
					json()
				],
				schema: {
					fields: [{
						name: 'id',
						type: 'string'
					}],
					name: 'test',
					namespace: 'api',
					type: 'record'
				}
			});

			server.addRoute({
				middleware: [
					json()
				],
				schema: {
					fields: [{
						name: 'id',
						type: 'string'
					}],
					name: 'test2',
					namespace: 'api',
					type: 'record'
				}
			});

			app = await server.listen();

		});

		it('should return a 400 if the message is invalid', async () => {

			// Given
			// When
			const response = await request(app)
				.post('/api/test')
				.send({})
				.expect(400);

			// Then
			expect(response.body).to.eql({
				error: 'Error validating message for schema (api.test)\nInvalid value (undefined) for path (id) it should be of type (string)'
			});

		});

		it('should publish a message to the correct queue', async () => {

			// Given
			const expectedPayload = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCYAXsibmFtZSI6ImFwaS50ZXN0IiwidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W3sibmFtZSI6ImlkIiwidHlwZSI6InN0cmluZyJ9XX1iYOKAi+KAi+KAi+KAi+KAi0I4NjA4QzExODdEMUEzQzQyMeKAi+KAi+KAi+KAi+KAiw==';

			// When
			await request(app)
				.post('/api/test')
				.send({
					id: '​​​​​B8608C1187D1A3C421​​​​​'
				})
				.expect(200);

			// Then
			const response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.test/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				}, {
					validateStatus: () => {
						return true;
					}
				});

			expect(response.statusText).to.eql('OK', `Failed to check the message queue: ${JSON.stringify(response.data)}`);
			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload, payloadMessage(expectedPayload, response));

		});

		it('should publish messages to the correct queues', async () => {

			// Given
			const expectedPayload1 = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCYAXsibmFtZSI6ImFwaS50ZXN0IiwidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W3sibmFtZSI6ImlkIiwidHlwZSI6InN0cmluZyJ9XX1iYOKAi+KAi+KAi+KAi+KAizU0NjRFNjJFMzU2MkQ1QkQ3M+KAi+KAi+KAi+KAi+KAiw==';
			const expectedPayload2 = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCaAXsibmFtZSI6ImFwaS50ZXN0MiIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOlt7Im5hbWUiOiJpZCIsInR5cGUiOiJzdHJpbmcifV19YmDigIvigIvigIvigIvigIs4OTJGRkUxOTYxRDY2NjhFMjLigIvigIvigIvigIvigIs=';

			// When
			await request(app)
				.post('/api/test')
				.send({
					id: '​​​​​5464E62E3562D5BD73​​​​​'
				})
				.expect(200);

			await request(app)
				.post('/api/test2')
				.send({
					id: '​​​​​892FFE1961D6668E22​​​​​'
				})
				.expect(200);

			// Then
			let response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.test/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				});

			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload1, payloadMessage(expectedPayload1, response));

			response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.test2/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				});

			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload2, payloadMessage(expectedPayload2, response));

		});

	});

	describe('API defined via endpoint with path mapper', () => {

		beforeEach(async () => {

			server.addRoute({
				middleware: [
					json()
				],
				pathMapper: (namespace) => {
					// 			e.g. api.v1_0
					// . => /	e.g. api/v1_0
					// _ => .	e.g. api/v1.0
					return namespace.replace(/\./g, '/').replace('_', '.');
				},
				schema: {
					fields: [{
						name: 'id',
						type: 'string'
					}],
					name: 'test',
					namespace: 'api.v1_0',
					type: 'record'
				}
			});

			server.addRoute({
				middleware: [
					json()
				],
				pathMapper: (namespace) => {
					// 			e.g. api.v1_0
					// . => /	e.g. api/v1_0
					// _ => .	e.g. api/v1.0
					return namespace.replace(/\./g, '/').replace('_', '.');
				},
				schema: {
					fields: [{
						name: 'id',
						type: 'string'
					}],
					name: 'test2',
					namespace: 'api.v1_0',
					type: 'record'
				}
			});

			app = await server.listen();

		});

		it('should return a 400 if the message is invalid', async () => {

			// Given
			// When
			const response = await request(app)
				.post('/api/v1.0/test')
				.send({})
				.expect(400);

			// Then
			expect(response.body).to.eql({
				error: 'Error validating message for schema (api.v1_0.test)\nInvalid value (undefined) for path (id) it should be of type (string)'
			});

		});

		it('should publish a message to the correct queue', async () => {

			// Given
			const expectedPayload = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCiAXsibmFtZSI6ImFwaS52MV8wLnRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLREQyNDU4QzNGRDI2RDk2QUJF4oCL4oCL4oCL4oCL4oCL';

			// When
			await request(app)
				.post('/api/v1.0/test')
				.send({
					id: '​​​​​DD2458C3FD26D96ABE​​​​​'
				})
				.expect(200);

			// Then
			const response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.v1_0.test/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				}, {
					validateStatus: () => {
						return true;
					}
				});

			expect(response.statusText).to.eql('OK', `Failed to check the message queue: ${JSON.stringify(response.data)}`);
			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload, payloadMessage(expectedPayload, response));

		});

		it('should publish messages to the correct queues', async () => {

			// Given
			const expectedPayload1 = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCiAXsibmFtZSI6ImFwaS52MV8wLnRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLQUE4MDM0MDZEREY1M0ZBNzU44oCL4oCL4oCL4oCL4oCL';
			const expectedPayload2 = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCkAXsibmFtZSI6ImFwaS52MV8wLnRlc3QyIiwidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W3sibmFtZSI6ImlkIiwidHlwZSI6InN0cmluZyJ9XX1iYOKAi+KAi+KAi+KAi+KAi0JBN0Y0REJFN0IwQTYzOUREROKAi+KAi+KAi+KAi+KAiw==';

			// When
			await request(app)
				.post('/api/v1.0/test')
				.send({
					id: '​​​​​AA803406DDF53FA758​​​​​'
				})
				.expect(200);

			await request(app)
				.post('/api/v1.0/test2')
				.send({
					id: '​​​​​BA7F4DBE7B0A639DDD​​​​​'
				})
				.expect(200);

			// Then
			let response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.v1_0.test/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				});

			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload1, payloadMessage(expectedPayload1, response));

			response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.v1_0.test2/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				});

			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload2, payloadMessage(expectedPayload2, response));

		});

	});

	describe('API defined via endpoint and Avro schema', () => {

		beforeEach(async () => {

			server.addRoute({
				endpoint: '/api/v1.0',
				middleware: [
					json()
				],
				schema: {
					fields: [{
						name: 'id',
						type: 'string'
					}],
					name: 'test',
					type: 'record'
				}
			});

			server.addRoute({
				endpoint: '/api/v1.0',
				middleware: [
					json()
				],
				schema: {
					fields: [{
						name: 'id',
						type: 'string'
					}],
					name: 'test2',
					type: 'record'
				}
			});

			app = await server.listen();

		});

		it('should return a 400 if the message is invalid', async () => {

			// Given
			// When
			const response = await request(app)
				.post('/api/v1.0/test')
				.send({})
				.expect(400);

			// Then
			expect(response.body).to.eql({
				error: 'Error validating message for schema (test)\nInvalid value (undefined) for path (id) it should be of type (string)'
			});

		});

		it('should publish a message to the correct queue', async () => {

			// Given
			const expectedPayload = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCQAXsibmFtZSI6InRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLNEI1MzQ0RjBGNzQwQzEwNDEz4oCL4oCL4oCL4oCL4oCL';

			// When
			await request(app)
				.post('/api/v1.0/test')
				.send({
					id: '​​​​​4B5344F0F740C10413​​​​​'
				})
				.expect(200);

			// Then
			const response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/test/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				}, {
					validateStatus: () => {
						return true;
					}
				});

			expect(response.statusText).to.eql('OK', `Failed to check the message queue: ${JSON.stringify(response.data)}`);
			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload, payloadMessage(expectedPayload, response));

		});

		it('should publish messages to the correct queues', async () => {

			// Given
			const expectedPayload1 = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCQAXsibmFtZSI6InRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLNUU0NURFQzZBQjgwOTNCQ0E24oCL4oCL4oCL4oCL4oCL';
			const expectedPayload2 = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCSAXsibmFtZSI6InRlc3QyIiwidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W3sibmFtZSI6ImlkIiwidHlwZSI6InN0cmluZyJ9XX1iYOKAi+KAi+KAi+KAi+KAi0UwRjQyODdEQkYzMEQ2MDY1NuKAi+KAi+KAi+KAi+KAiw==';

			// When
			await request(app)
				.post('/api/v1.0/test')
				.send({
					id: '​​​​​5E45DEC6AB8093BCA6​​​​​'
				})
				.expect(200);

			await request(app)
				.post('/api/v1.0/test2')
				.send({
					id: '​​​​​E0F4287DBF30D60656​​​​​'
				})
				.expect(200);

			// Then
			let response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/test/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				});

			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload1, payloadMessage(expectedPayload1, response));

			response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/test2/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				});

			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload2, payloadMessage(expectedPayload2, response));

		});

	});

	describe('API defined via endpoint and Avro schema that publishes to a queue specified in publish options', () => {

		beforeEach(async () => {

			server.addRoute({
				endpoint: '/api/v1.0',
				middleware: [
					json()
				],
				publishOptions: {
					eventName: 'internal.api.v1.0.test'
				},
				schema: {
					fields: [{
						name: 'id',
						type: 'string'
					}],
					name: 'test',
					type: 'record'
				}
			});

			server.addRoute({
				endpoint: '/api/v1.0',
				middleware: [
					json()
				],
				publishOptions: {
					eventName: 'internal.api.v1.0.test2'
				},
				schema: {
					fields: [{
						name: 'id',
						type: 'string'
					}],
					name: 'test2',
					type: 'record'
				}
			});

			app = await server.listen();

		});

		it('should return a 400 if the message is invalid', async () => {

			// Given
			// When
			const response = await request(app)
				.post('/api/v1.0/test')
				.send({})
				.expect(400);

			// Then
			expect(response.body).to.eql({
				error: 'Error validating message for schema (test)\nInvalid value (undefined) for path (id) it should be of type (string)'
			});

		});

		it('should publish a message to the correct queue', async () => {

			// Given
			const expectedPayload = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCQAXsibmFtZSI6InRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLMUMwQTNCOEY2OURDRjk5Mjc04oCL4oCL4oCL4oCL4oCL';

			// When
			await request(app)
				.post('/api/v1.0/test')
				.send({
					id: '​​​​​1C0A3B8F69DCF99274​​​​​'
				})
				.expect(200);

			// Then
			const response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/internal.api.v1.0.test/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				}, {
					validateStatus: () => {
						return true;
					}
				});

			expect(response.statusText).to.eql('OK', `Failed to check the message queue: ${JSON.stringify(response.data)}`);
			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload, payloadMessage(expectedPayload, response));

		});

		it('should publish messages to the correct queues', async () => {

			// Given
			const expectedPayload1 = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCQAXsibmFtZSI6InRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLMTJFQTYyQjVGRUMwRUFBMTZE4oCL4oCL4oCL4oCL4oCL';
			const expectedPayload2 = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCSAXsibmFtZSI6InRlc3QyIiwidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W3sibmFtZSI6ImlkIiwidHlwZSI6InN0cmluZyJ9XX1iYOKAi+KAi+KAi+KAi+KAizYwNzU5ODNCMTUwOTZGOTZBMOKAi+KAi+KAi+KAi+KAiw==';

			// When
			await request(app)
				.post('/api/v1.0/test')
				.send({
					id: '​​​​​12EA62B5FEC0EAA16D​​​​​'
				})
				.expect(200);

			await request(app)
				.post('/api/v1.0/test2')
				.send({
					id: '​​​​​6075983B15096F96A0​​​​​'
				})
				.expect(200);

			// Then
			let response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/internal.api.v1.0.test/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				});

			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload1, payloadMessage(expectedPayload1, response));

			response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/internal.api.v1.0.test2/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				});

			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload2, payloadMessage(expectedPayload2, response));

		});

	});

	describe('different methods with the same endpoint', () => {

		beforeEach(async () => {

			server.addRoute({
				endpoint: '/api/v1.0',
				method: 'get',
				middleware: [
					json()
				],
				publishOptions: {
					eventName: 'internal.api.v1.0.exists'
				},
				schema: {
					fields: [{
						name: 'id',
						type: 'string'
					}],
					name: 'test',
					type: 'record'
				}
			});

			server.addRoute({
				endpoint: '/api/v1.0',
				method: 'post',
				middleware: [
					json()
				],
				publishOptions: {
					eventName: 'internal.api.v1.0.create'
				},
				schema: {
					fields: [{
						name: 'id',
						type: 'string'
					}],
					name: 'test',
					type: 'record'
				}
			});

			app = await server.listen();

		});

		it('should publish messages to the correct queues', async () => {

			// Given
			const expectedPayload1 = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCQAXsibmFtZSI6InRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLMEIwMEVCQzFBRDhCQ0IwNzk14oCL4oCL4oCL4oCL4oCL';
			const expectedPayload2 = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCQAXsibmFtZSI6InRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLNkVEOTJEMTkzMkNERERGMERC4oCL4oCL4oCL4oCL4oCL';

			// When
			await request(app)
				.get('/api/v1.0/test')
				.send({
					id: '​​​​​0B00EBC1AD8BCB0795​​​​​'
				})
				.expect(200);

			await request(app)
				.post('/api/v1.0/test')
				.send({
					id: '​​​​​6ED92D1932CDDDF0DB​​​​​'
				})
				.expect(200);

			// Then
			let response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/internal.api.v1.0.exists/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				});

			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload1, payloadMessage(expectedPayload1, response));

			response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/internal.api.v1.0.create/get',
				{
					ackmode: 'ack_requeue_false',
					count: '1',
					encoding: 'auto',
					requeue: false,
					truncate: '50000',
					vhost: '/'
				});

			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload2, payloadMessage(expectedPayload2, response));

		});

	});

});
