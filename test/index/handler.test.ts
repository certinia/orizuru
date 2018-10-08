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
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import avsc from 'avsc';
import { EventEmitter } from 'events';
import _ from 'lodash';

import { HandlerFunctionValidator } from '../../src/index/validator/handlerFunction';

import { Handler, ITransport, Options } from '../../src';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;

describe('index/handler', () => {

	let transport: ITransport;
	let options: Options.IHandler;

	beforeEach(() => {

		transport = {
			close: sinon.stub(),
			connect: sinon.stub(),
			publish: sinon.stub(),
			subscribe: sinon.stub()
		};

		options = {
			transport
		};

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('constructor', () => {

		it('should extend EventEmitter', () => {

			// Given
			// When
			const handler = new Handler(options);

			// Then
			expect(handler).to.be.an.instanceof(EventEmitter);

		});

		it('should emit an error event if the configuration is invalid', () => {

			// Given
			sinon.spy(EventEmitter.prototype, 'emit');

			delete options.transport;

			// When
			// Then
			expect(() => new Handler(options)).to.throw(/^Missing required object parameter: transport\.$/g);

			expect(EventEmitter.prototype.emit).to.have.been.calledOnce;
			expect(EventEmitter.prototype.emit).to.have.been.calledWith(Handler.ERROR);

		});

	});

	describe('init', () => {

		it('should connect to the transport', async () => {

			// Given
			const handler = new Handler(options);

			// When
			await handler.init();

			// Then
			expect(options.transport.connect).to.have.been.calledOnce;
			expect(options.transport.connect).to.have.been.calledWithExactly();

		});

	});

	describe('handle', () => {

		it('should install the handler for a schema', async () => {

			// Given
			options.transport.subscribe = sinon.stub().resolves();
			sinon.stub(HandlerFunctionValidator.prototype, 'validate');
			sinon.spy(EventEmitter.prototype, 'emit');

			const handler = new Handler(options);

			const config: any = {
				handler: sinon.stub(),
				message: {
					first: 'First',
					last: 'Last'
				},
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

			// When
			await handler.handle(config);

			// Then
			expect(HandlerFunctionValidator.prototype.validate).to.have.been.calledOnce;
			expect(EventEmitter.prototype.emit).to.have.been.calledOnce;
			expect(EventEmitter.prototype.emit).to.have.been.calledWithExactly(Handler.INFO, 'Installing handler for com.example.FullName events.');

		});

		describe('should throw an error', () => {

			it('if no config is provided', async () => {

				// Given
				sinon.stub(HandlerFunctionValidator.prototype, 'validate').throws(new Error('Missing required object parameter.'));

				const handler = new Handler(options);
				const handleOptions: any = {};

				// When
				await expect(handler.handle(handleOptions)).to.eventually.be.rejectedWith(/^Missing required object parameter\.$/);

				// Then
				expect(HandlerFunctionValidator.prototype.validate).to.have.been.calledOnce;

			});

		});

	});

});
