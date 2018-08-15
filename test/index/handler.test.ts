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

import { Handler } from '../../src';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;

describe('index/handler', () => {

	let mocks: any;

	beforeEach(() => {

		mocks = {};

		mocks.config = {
			transport: {
				connect: _.noop,
				publish: _.noop,
				subscribe: _.noop
			},
			transportConfig: _.noop
		};

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('constructor', () => {

		it('should extend EventEmitter', () => {

			// Given
			// When
			const handler = new Handler(mocks.config);

			// Then
			expect(handler).to.be.an.instanceof(EventEmitter);

		});

		it('should emit an error event if the configuration is invalid', () => {

			// Given
			sinon.spy(EventEmitter.prototype, 'emit');

			// When
			// Then
			expect(() => new Handler({} as any)).to.throw(/^Missing required object parameter: transport\.$/g);

			expect(EventEmitter.prototype.emit).to.have.been.calledTwice;
			expect(EventEmitter.prototype.emit).to.have.been.calledWith('info_event', 'Creating handler.');
			expect(EventEmitter.prototype.emit).to.have.been.calledWith('error_event');

		});

	});

	describe('handle', () => {

		it('should install the handler for a schema', () => {

			// Given
			mocks.config.transport.subscribe = sinon.stub().resolves();
			sinon.stub(HandlerFunctionValidator.prototype, 'validate');
			sinon.spy(EventEmitter.prototype, 'emit');

			const handler = new Handler(mocks.config);

			const config = {
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
			// Then
			return expect(handler.handle(config as any))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(HandlerFunctionValidator.prototype.validate).to.have.been.calledOnce;
					expect(EventEmitter.prototype.emit).to.have.been.calledTwice;
					expect(EventEmitter.prototype.emit).to.have.been.calledWith('info_event', 'Creating handler.');
					expect(EventEmitter.prototype.emit).to.have.been.calledWith('info_event', 'Installing handler for com.example.FullName events.');
				});

		});

		describe('should throw an error', () => {

			it('if no config is provided', () => {

				// Given
				sinon.stub(HandlerFunctionValidator.prototype, 'validate').throws(new Error('Missing required object parameter.'));

				const handler = new Handler(mocks.config);

				// When
				// Then
				return expect(handler.handle({} as any)).to.eventually.be.rejectedWith(/^Missing required object parameter\.$/)
					.then(() => {
						expect(HandlerFunctionValidator.prototype.validate).to.have.been.calledOnce;
					});

			});

		});

	});

});
