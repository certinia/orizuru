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

	before(() => {

		transport = new Transport({
			url: 'amqp://localhost'
		});

		server = new Server({
			port: 8080,
			transport
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

	after(async () => {
		await server.close();
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
		try {

			await request(app)
				.post('/api/test')
				.send({
					id: 'testId'
				})
				.expect(200);

		} catch (error) {
			expect.fail('Initial request failed.');
		}

		// Then
		const response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.test/get',
			{
				ackmode: 'ack_requeue_false',
				count: '1',
				encoding: 'auto',
				name: 'api.test',
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
		try {

			await request(app)
				.post('/api/test')
				.send({
					id: 'testId'
				})
				.expect(200);

		} catch (error) {
			expect.fail('First request failed.');
		}

		try {

			await request(app)
				.post('/api/test2')
				.send({
					id: 'testId'
				})
				.expect(200);

		} catch (error) {
			expect.fail('Second request failed.');
		}

		// Then
		let response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.test/get',
			{
				ackmode: 'ack_requeue_false',
				count: '1',
				encoding: 'auto',
				name: 'api.test',
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
				name: 'api.test',
				requeue: false,
				truncate: '50000',
				vhost: '/'
			});

		expect(response.data.length).to.eql(1);
		expect(response.data[0].message_count).to.eql(0);
		expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AJoBeyJuYW1lIjoiYXBpLnRlc3QyIiwidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W3sibmFtZSI6ImlkIiwidHlwZSI6InN0cmluZyJ9XX0ODHRlc3RJZA==');

	});

});
