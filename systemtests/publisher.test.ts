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

import axios from 'axios';
import _ from 'lodash';

import { Transport } from '@financialforcedev/orizuru-transport-rabbitmq';

import { ITransport, Publisher } from '../src';

const expect = chai.expect;

describe('RabbitMQ publisher', () => {

	let schema: any;
	let transport: ITransport;

	before(async () => {

		transport = new Transport({
			url: 'amqp://localhost'
		});

		schema = {
			fields: [{
				name: 'id',
				type: 'string'
			}],
			name: 'test',
			namespace: 'api',
			type: 'record'
		};

	});

	after(async () => {
		await transport.close();
	});

	it('should publish messages to the correct queue', async () => {

		// Given
		const publisher = new Publisher({
			transport
		});

		// When
		await publisher.publish({
			message: {
				context: {},
				message: {
					id: 'testId'
				}
			},
			schema
		});

		const response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.test/get',
			{
				ackmode: 'ack_requeue_false',
				count: '1',
				encoding: 'auto',
				name: 'api.test',
				requeue: false,
				truncate: '50000',
				vhost: '/'
			});

		// Then
		expect(response.data.length).to.eql(1);
		expect(response.data[0].message_count).to.eql(0);
		expect(response.data[0].payload).to.eql('OnsidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W119AJgBeyJuYW1lIjoiYXBpLnRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfQ4MdGVzdElk');

	});

});
