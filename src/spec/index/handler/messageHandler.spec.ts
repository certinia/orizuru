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
 **/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import avsc from 'avsc';

import messageHandler from '../../../lib/index/handler/messageHandler';

chai.use(sinonChai);

describe('index/handler/messageHandler', () => {

	let server: any, config: any;

	beforeEach(() => {
		server = {
			error: sinon.stub(),
			info: sinon.stub(),
			transport: {
				decode: sinon.stub()
			}
		};
		server.transport.decode.returns('test');
		config = {
			handler: sinon.stub(),
			schema: avsc.Type.forSchema({
				type: 'record',
				namespace: 'com.example',
				name: 'FullName',
				fields: [
					{ name: 'first', type: 'string' },
					{ name: 'last', type: 'string' }
				]
			})
		};
	});

	afterEach(() => {
		//sinon.restore({});
	});

	it('should handle a message where the base handler resolves', async () => {

		// Given

		config.handler.resolves();

		// When
		await messageHandler(server, config)(new Buffer('test'));

		// Then
		expect(config.handler).to.have.been.calledOnce;
		expect(config.handler).to.have.been.calledWith('test');
		expect(server.info).to.have.been.calledOnce;
		expect(server.info).to.have.been.calledWith('Handler received com.example.FullName event.');
		expect(server.error).to.not.have.been.called;

	});

	it('should handle a message where the base handler returns', async () => {

		// Given

		config.handler.returns(null);

		// When
		await messageHandler(server, config)(new Buffer('test'));

		// Then
		expect(config.handler).to.have.been.calledOnce;
		expect(config.handler).to.have.been.calledWith('test');
		expect(server.info).to.have.been.calledOnce;
		expect(server.info).to.have.been.calledWith('Handler received com.example.FullName event.');
		expect(server.error).to.not.have.been.called;

	});

	it('should handle a message where the base handler rejects', async () => {

		// Given
		const expectedError = new Error('Error');

		config.handler.rejects(expectedError);

		// When

		await messageHandler(server, config)(new Buffer('test'));

		// Then
		expect(config.handler).to.have.been.calledOnce;
		expect(config.handler).to.have.been.calledWith('test');
		expect(server.info).to.have.been.calledOnce;
		expect(server.info).to.have.been.calledWith('Handler received com.example.FullName event.');
		expect(server.error).to.have.been.calledWith(expectedError);

	});

	it('should handle a message where the base handler throws', async () => {

		// Given
		const expectedError = new Error('Error');

		config.handler.throws(expectedError);

		// When

		await messageHandler(server, config)(new Buffer('test'));

		// Then
		expect(config.handler).to.have.been.calledOnce;
		expect(config.handler).to.have.been.calledWith('test');
		expect(server.info).to.have.been.calledOnce;
		expect(server.info).to.have.been.calledWith('Handler received com.example.FullName event.');
		expect(server.error).to.have.been.calledWith(expectedError);

	});

	it('should throw an error if the message decoding fails', () => {

		// Given
		const expectedError = new Error('Failed to decode message.');

		server.transport.decode.throws(expectedError);

		// When
		messageHandler(server, config)(new Buffer('test'));

		// Then
		expect(server.info).to.have.been.calledOnce;
		expect(server.info).to.have.been.calledWith('Handler received com.example.FullName event.');
		expect(server.error).to.have.been.calledOnce;
		expect(server.error).to.have.been.calledWith(expectedError);
		expect(config.handler).to.not.have.been.called;

	});

});
