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
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import request from 'supertest';

import axios from 'axios';
import _ from 'lodash';

import { Transport } from '@financialforcedev/orizuru-transport-rabbitmq';

import { Handler, IOrizuruMessage, ITransport, json, Server } from '../src';

chai.use(sinonChai);

const expect = chai.expect;

describe('RabbitMQ handler', () => {

	let handlerTransport: ITransport;
	let serverTransport: ITransport;
	let server: Server;
	let app: any;
	let schema1: any;

	before(async () => {

		serverTransport = new Transport({
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

		schema1 = {
			fields: [{
				name: 'id',
				type: 'string'
			}],
			name: 'test',
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

	afterEach(async () => {
		await serverTransport.close();
		app.close();
	});

	after(async () => {
		await handlerTransport.close();
	});

	it('should consume messages from the correct queue', async () => {

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
				id: 'testId'
			})
			.expect(200);

		const handler = new Handler({
			transport: handlerTransport
		});

		let handlerSpy;

		// When
		const testMessage = await new Promise((resolve) => {

			handlerSpy = sinon.spy(async (message: IOrizuruMessage<any, any>) => {
				resolve(message);
			});

			// When
			handler.handle({
				handler: handlerSpy,
				schema: schema1
			});

		});

		const response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.test2/get', {
			ackmode: 'ack_requeue_false',
			count: '1',
			encoding: 'auto',
			name: 'api.test',
			requeue: false,
			truncate: '50000',
			vhost: '/'
		});

		// Then
		expect(testMessage).to.eql({
			context: {},
			message: {
				id: 'testId'
			}
		});
		expect(handlerSpy).to.have.been.calledOnce;
		expect(response.data.length).to.eql(1);
		expect(response.data[0].message_count).to.eql(0);
		expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AJoBeyJuYW1lIjoiYXBpLnRlc3QyIiwidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W3sibmFtZSI6ImlkIiwidHlwZSI6InN0cmluZyJ9XX0ODHRlc3RJZA==');

	});

});
