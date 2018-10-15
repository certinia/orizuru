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

import { Type } from 'avsc';
import axios from 'axios';
import _ from 'lodash';

import { Transport } from '@financialforcedev/orizuru-transport-rabbitmq';

import { ITransport, Publisher } from '../src';

const expect = chai.expect;

describe('RabbitMQ publisher', () => {

	let transport: ITransport;

	before(async () => {

		transport = new Transport({
			url: 'amqp://localhost'
		});

	});

	after(async () => {
		await transport.close();
	});

	describe('should publish messages to the correct queue', () => {

		it('schema using only name', async () => {

			// Given
			const expectedPayload = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCQAXsibmFtZSI6InRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLRjNBNTY2OTFGRDlCM0I5OEMy4oCL4oCL4oCL4oCL4oCL';

			const schema = Type.forSchema({
				fields: [{
					name: 'id',
					type: 'string'
				}],
				name: 'test',
				type: 'record'
			});

			const publisher = new Publisher({
				transport
			});

			await publisher.init();

			// When
			await publisher.publish({
				message: {
					context: {},
					message: {
						id: '​​​​​F3A56691FD9B3B98C2​​​​​'
					}
				},
				schema
			});

			// Then
			const response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/test/get',
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
			expect(response.data[0].payload).to.eql(expectedPayload, `\nactual ${Buffer.from(expectedPayload, 'base64').toString()}\nexpected ${Buffer.from(response.data[0].payload, 'base64').toString()}\nraw`);

		});

		it('schema using name and namespace', async () => {

			// Given
			const expectedPayload = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCYAXsibmFtZSI6ImFwaS50ZXN0IiwidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W3sibmFtZSI6ImlkIiwidHlwZSI6InN0cmluZyJ9XX1iYOKAi+KAi+KAi+KAi+KAizNBRjlEMkQ2Qzg1NTA2RERBOeKAi+KAi+KAi+KAi+KAiw==';

			const schema = Type.forSchema({
				fields: [{
					name: 'id',
					type: 'string'
				}],
				name: 'test',
				namespace: 'api',
				type: 'record'
			});

			const publisher = new Publisher({
				transport
			});

			await publisher.init();

			// When
			await publisher.publish({
				message: {
					context: {},
					message: {
						id: '​​​​​3AF9D2D6C85506DDA9​​​​​'
					}
				},
				schema
			});

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
				});

			expect(response.data.length).to.eql(1);
			expect(response.data[0].message_count).to.eql(0);
			expect(response.data[0].payload).to.eql(expectedPayload, `\nactual ${Buffer.from(expectedPayload, 'base64').toString()}\nexpected ${Buffer.from(response.data[0].payload, 'base64').toString()}\nraw`);

		});

		it('schema using v1.0 within the namespace', async () => {

			// Given
			const expectedPayload = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCiAXsibmFtZSI6ImFwaS52MV8wLnRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLRDAwNkIyNUZFMjg4MTlBMzc14oCL4oCL4oCL4oCL4oCL';

			const schema = Type.forSchema({
				fields: [{
					name: 'id',
					type: 'string'
				}],
				name: 'test',
				namespace: 'api.v1_0',
				type: 'record'
			});

			const publisher = new Publisher({
				transport
			});

			await publisher.init();

			// When
			await publisher.publish({
				message: {
					context: {},
					message: {
						id: '​​​​​D006B25FE28819A375​​​​​'
					}
				},
				schema
			});

			// Then
			const response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/api.v1_0.test/get',
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
			expect(response.data[0].payload).to.eql(expectedPayload, `\nactual ${Buffer.from(expectedPayload, 'base64').toString()}\nexpected ${Buffer.from(response.data[0].payload, 'base64').toString()}\nraw`);

		});

		it('using publish options', async () => {

			// Given
			const expectedPayload = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCiAXsibmFtZSI6ImFwaS52MV8wLnRlc3QiLCJ0eXBlIjoicmVjb3JkIiwiZmllbGRzIjpbeyJuYW1lIjoiaWQiLCJ0eXBlIjoic3RyaW5nIn1dfWJg4oCL4oCL4oCL4oCL4oCLRUEzNEY5NEE1MjAzRDFDQTkw4oCL4oCL4oCL4oCL4oCL';

			const schema = Type.forSchema({
				fields: [{
					name: 'id',
					type: 'string'
				}],
				name: 'test',
				namespace: 'api.v1_0',
				type: 'record'
			});

			const publisher = new Publisher({
				transport
			});

			await publisher.init();

			// When
			await publisher.publish({
				message: {
					context: {},
					message: {
						id: '​​​​​EA34F94A5203D1CA90​​​​​'
					}
				},
				publishOptions: {
					eventName: 'internal.api.v1.0.test'
				},
				schema
			});

			// Then
			const response = await axios.post('http://guest:guest@localhost:15672/api/queues/%2F/internal.api.v1.0.test/get',
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
			expect(response.data[0].payload).to.eql(expectedPayload, `\nactual ${Buffer.from(expectedPayload, 'base64').toString()}\nexpected ${Buffer.from(response.data[0].payload, 'base64').toString()}\nraw`);

		});

	});

	describe('should publish messages to the correct queues', () => {

		it('with multiple publishers', async () => {

			// Given
			const expectedPayload1 = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCYAXsibmFtZSI6ImFwaS50ZXN0IiwidHlwZSI6InJlY29yZCIsImZpZWxkcyI6W3sibmFtZSI6ImlkIiwidHlwZSI6InN0cmluZyJ9XX1iYOKAi+KAi+KAi+KAi+KAizczMTY4RjczNzg4NjI0RTg0NuKAi+KAi+KAi+KAi+KAiw==';
			const expectedPayload2 = 'lAF7Im5hbWUiOiJjb20uZmluYW5jaWFsZm9yY2Uub3JpenVydS5Db250ZXh0MSIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOltdfQCaAXsibmFtZSI6ImFwaS50ZXN0MiIsInR5cGUiOiJyZWNvcmQiLCJmaWVsZHMiOlt7Im5hbWUiOiJpZCIsInR5cGUiOiJzdHJpbmcifV19YmDigIvigIvigIvigIvigIsyOUNDRjA5OTMxNjA5RDZCRkXigIvigIvigIvigIvigIs=';

			const schema1 = Type.forSchema({
				fields: [{
					name: 'id',
					type: 'string'
				}],
				name: 'test',
				namespace: 'api',
				type: 'record'
			});

			const schema2 = Type.forSchema({
				fields: [{
					name: 'id',
					type: 'string'
				}],
				name: 'test2',
				namespace: 'api',
				type: 'record'
			});

			const publisher = new Publisher({
				transport
			});

			await publisher.init();

			// When
			await publisher.publish({
				message: {
					context: {},
					message: {
						id: '​​​​​73168F73788624E846​​​​​'
					}
				},
				schema: schema1
			});

			await publisher.publish({
				message: {
					context: {},
					message: {
						id: '​​​​​29CCF09931609D6BFE​​​​​'
					}
				},
				schema: schema2
			});

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
			expect(response.data[0].payload).to.eql(expectedPayload1, `\nactual ${Buffer.from(expectedPayload1, 'base64').toString()}\nexpected ${Buffer.from(response.data[0].payload, 'base64').toString()}\nraw`);

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
			expect(response.data[0].payload).to.eql(expectedPayload2, `\nactual ${Buffer.from(expectedPayload2, 'base64').toString()}\nexpected ${Buffer.from(response.data[0].payload, 'base64').toString()}\nraw`);

		});

	});

});
