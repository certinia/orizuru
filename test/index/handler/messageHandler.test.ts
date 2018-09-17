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

import avsc from 'avsc';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Transport } from '../../../src/index/transport/transport';

import { messageHandler } from '../../../src/index/handler/messageHandler';

chai.use(sinonChai);

const expect = chai.expect;

describe('index/handler/messageHandler', () => {

	let config: any;
	let server: any;

	beforeEach(() => {

		server = {
			error: sinon.stub(),
			info: sinon.stub()
		};

		config = {
			handler: sinon.stub(),
			schema: avsc.Type.forSchema({
				fields: [
					{ name: 'first', type: 'string' },
					{ name: 'last', type: 'string' }
				],
				name: 'FullName',
				namespace: 'com.example',
				type: 'record'
			})
		};

	});

	afterEach(() => {
		sinon.restore();
	});

	it('should handle a message where the base handler resolves', async () => {

		// Given
		sinon.stub(Transport.prototype, 'decode').returns('test');

		config.handler.resolves();

		// When
		await messageHandler(server, config)(Buffer.from('test'));

		// Then
		expect(config.handler).to.have.been.calledOnce;
		expect(config.handler).to.have.been.calledWithExactly('test');
		expect(server.info).to.have.been.calledOnce;
		expect(server.info).to.have.been.calledWithExactly('Handler received com.example.FullName event.');
		expect(server.error).to.not.have.been.called;

	});

	it('should handle a message where the base handler returns', async () => {

		// Given
		sinon.stub(Transport.prototype, 'decode').returns('test');

		config.handler.returns(null);

		// When
		await messageHandler(server, config)(new Buffer('test'));

		// Then
		expect(config.handler).to.have.been.calledOnce;
		expect(config.handler).to.have.been.calledWithExactly('test');
		expect(server.info).to.have.been.calledOnce;
		expect(server.info).to.have.been.calledWithExactly('Handler received com.example.FullName event.');
		expect(server.error).to.not.have.been.called;

	});

	it('should handle a message where the base handler rejects', async () => {

		// Given
		sinon.stub(Transport.prototype, 'decode').returns('test');

		const expectedError = new Error('Error');

		config.handler.rejects(expectedError);

		// When

		await messageHandler(server, config)(new Buffer('test'));

		// Then
		expect(config.handler).to.have.been.calledOnce;
		expect(config.handler).to.have.been.calledWithExactly('test');
		expect(server.info).to.have.been.calledOnce;
		expect(server.info).to.have.been.calledWithExactly('Handler received com.example.FullName event.');
		expect(server.error).to.have.been.calledWithExactly(expectedError);

	});

	it('should handle a message where the base handler throws', async () => {

		// Given
		sinon.stub(Transport.prototype, 'decode').returns('test');

		const expectedError = new Error('Error');

		config.handler.throws(expectedError);

		// When
		await messageHandler(server, config)(new Buffer('test'));

		// Then
		expect(config.handler).to.have.been.calledOnce;
		expect(config.handler).to.have.been.calledWithExactly('test');
		expect(server.info).to.have.been.calledOnce;
		expect(server.info).to.have.been.calledWithExactly('Handler received com.example.FullName event.');
		expect(server.error).to.have.been.calledWithExactly(expectedError);

	});

	it('should throw an error if the message decoding fails', () => {

		// Given
		const expectedError = new Error('Failed to decode message.');

		sinon.stub(Transport.prototype, 'decode').throws(expectedError);

		// When
		messageHandler(server, config)(new Buffer('test'));

		// Then
		expect(server.info).to.have.been.calledOnce;
		expect(server.info).to.have.been.calledWithExactly('Handler received com.example.FullName event.');
		expect(server.error).to.have.been.calledOnce;
		expect(server.error).to.have.been.calledWithExactly(expectedError);
		expect(config.handler).to.not.have.been.called;

	});

});
