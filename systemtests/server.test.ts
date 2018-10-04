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

import axios from 'axios';

import { Transport } from '@financialforcedev/orizuru-transport-rabbitmq';

import { ITransport, json, Server } from '../src';

const expect = chai.expect;

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

	describe('API defined within Avro schema', () => {

		beforeEach(() => {

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

			app = server.listen();

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
				error: 'Error encoding message for schema (api.test):\ninvalid value (undefined) for path (id) it should be of type (string)\ninvalid \"string\": undefined'
			});

		});

		it('should publish a message to the correct queue', async () => {

			// Given
			// When
			await request(app)
				.post('/api/test')
				.send({
					id: 'testId'
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
			expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AJgBeyJuYW1lIjoiYXBpLnRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfQ4MdGVzdElk');

		});

		it('should publish messages to the correct queues', async () => {

			// Given
			// When
			await request(app)
				.post('/api/test')
				.send({
					id: 'testId'
				})
				.expect(200);

			await request(app)
				.post('/api/test2')
				.send({
					id: 'testId'
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
			expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AJgBeyJuYW1lIjoiYXBpLnRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfQ4MdGVzdElk');

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
			expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AJoBeyJuYW1lIjoiYXBpLnRlc3QyIiwidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W3sibmFtZSI6ImlkIiwidHlwZSI6InN0cmluZyJ9XX0ODHRlc3RJZA==');

		});

	});

	describe('API defined via endpoint with path mapper', () => {

		beforeEach(() => {

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

			app = server.listen();

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
				error: 'Error encoding message for schema (api.v1_0.test):\ninvalid value (undefined) for path (id) it should be of type (string)\ninvalid \"string\": undefined'
			});

		});

		it('should publish a message to the correct queue', async () => {

			// Given
			// When
			await request(app)
				.post('/api/v1.0/test')
				.send({
					id: '​​​​​DD2458C3FD26D96ABE​​​​​'
				})
				.expect(200);

			// Then
			const response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.v1.0.test/get',
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
			expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AKIBeyJuYW1lIjoiYXBpLnYxXzAudGVzdCIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOlt7Im5hbWUiOiJpZCIsInR5cGUiOiJzdHJpbmcifV19YmDigIvigIvigIvigIvigItERDI0NThDM0ZEMjZEOTZBQkXigIvigIvigIvigIvigIs=');

		});

		it('should publish messages to the correct queues', async () => {

			// Given
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
			let response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.v1.0.test/get',
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
			expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AKIBeyJuYW1lIjoiYXBpLnYxXzAudGVzdCIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOlt7Im5hbWUiOiJpZCIsInR5cGUiOiJzdHJpbmcifV19YmDigIvigIvigIvigIvigItBQTgwMzQwNkRERjUzRkE3NTjigIvigIvigIvigIvigIs=');

			response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.v1.0.test2/get',
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
			expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AKQBeyJuYW1lIjoiYXBpLnYxXzAudGVzdDIiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLQkE3RjREQkU3QjBBNjM5RERE4oCL4oCL4oCL4oCL4oCL');

		});

	});

	describe('API defined via endpoint and Avro schema', () => {

		beforeEach(() => {

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

			app = server.listen();

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
				error: 'Error encoding message for schema (test):\ninvalid value (undefined) for path (id) it should be of type (string)\ninvalid \"string\": undefined'
			});

		});

		it('should publish a message to the correct queue', async () => {

			// Given
			// When
			await request(app)
				.post('/api/v1.0/test')
				.send({
					id: '​​​​​4B5344F0F740C10413​​​​​'
				})
				.expect(200);

			// Then
			const response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.v1.0.test/get',
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
			expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AJABeyJuYW1lIjoidGVzdCIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOlt7Im5hbWUiOiJpZCIsInR5cGUiOiJzdHJpbmcifV19YmDigIvigIvigIvigIvigIs0QjUzNDRGMEY3NDBDMTA0MTPigIvigIvigIvigIvigIs=');

		});

		it('should publish messages to the correct queues', async () => {

			// Given
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
			let response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.v1.0.test/get',
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
			expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AJABeyJuYW1lIjoidGVzdCIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOlt7Im5hbWUiOiJpZCIsInR5cGUiOiJzdHJpbmcifV19YmDigIvigIvigIvigIvigIs1RTQ1REVDNkFCODA5M0JDQTbigIvigIvigIvigIvigIs=');

			response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.v1.0.test2/get',
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
			expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AJIBeyJuYW1lIjoidGVzdDIiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLRTBGNDI4N0RCRjMwRDYwNjU24oCL4oCL4oCL4oCL4oCL');

		});

	});

	describe('API defined via endpoint and Avro schema that publishes to a queue specified in publish options', () => {

		beforeEach(() => {

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

			app = server.listen();

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
				error: 'Error encoding message for schema (test):\ninvalid value (undefined) for path (id) it should be of type (string)\ninvalid \"string\": undefined'
			});

		});

		it('should publish a message to the correct queue', async () => {

			// Given
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
			expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AJABeyJuYW1lIjoidGVzdCIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOlt7Im5hbWUiOiJpZCIsInR5cGUiOiJzdHJpbmcifV19YmDigIvigIvigIvigIvigIsxQzBBM0I4RjY5RENGOTkyNzTigIvigIvigIvigIvigIs=');

		});

		it('should publish messages to the correct queues', async () => {

			// Given
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
			expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AJABeyJuYW1lIjoidGVzdCIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOlt7Im5hbWUiOiJpZCIsInR5cGUiOiJzdHJpbmcifV19YmDigIvigIvigIvigIvigIsxMkVBNjJCNUZFQzBFQUExNkTigIvigIvigIvigIvigIs=');

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
			expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AJIBeyJuYW1lIjoidGVzdDIiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLNjA3NTk4M0IxNTA5NkY5NkEw4oCL4oCL4oCL4oCL4oCL');

		});

	});

});
