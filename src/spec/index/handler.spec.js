/**
 * Copyright (c) 2017, FinancialForce.com, inc
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

'use strict';

const
	_ = require('lodash'),
	root = require('app-root-path'),
	chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	sinon = require('sinon'),
	{ expect } = chai,
	{ calledOnce, calledWith } = sinon.assert,

	Handler = require(root + '/src/lib/index/handler'),
	{ compileFromSchemaDefinition } = require(root + '/src/lib/index/shared/schema'),
	{ toBuffer } = require(root + '/src/lib/index/shared/transport');

chai.use(chaiAsPromised);

describe('index/handler.js', () => {

	const
		sandbox = sinon.sandbox.create(),
		restore = sandbox.restore.bind(sandbox);

	let config;

	beforeEach(() => {

		config = {
			transport: {
				publish: _.noop,
				subscribe: sandbox.stub()
			},
			transportConfig: 'testTransportConfig'
		};

	});

	afterEach(restore);

	describe('handle', () => {

		let handlerInstance;

		beforeEach(() => {
			handlerInstance = new Handler(config);
		});

		it('should reject if a valid callback function is not supplied', () => {

			// given - when - then
			return expect(handlerInstance.handle({ eventName: 'testSchema', callback: null })).to.be.rejectedWith('Please provide a valid callback function for event: \'testSchema\'');

		});

		it('should call subscribe handle with eventName and the handler function wrapped in a helper to deserialize the message to its schema and return its result', () => {

			// given
			const spy = sandbox.spy();
			config.transport.subscribe.callsFake(obj => {
				obj.handler(toBuffer(compileFromSchemaDefinition({
					type: 'record',
					fields: [{
						name: 'f',
						type: 'string'
					}]
				}), {
					f: 'test1'
				}, {
					auth: 'testAuth'
				}));
				return Promise.resolve('a');
			});

			// when - then
			return expect(handlerInstance.handle({ eventName: 'testSchema', callback: spy })).to.eventually.be.eql('a')
				.then(() => {
					calledOnce(config.transport.subscribe);
					calledWith(config.transport.subscribe, { eventName: 'testSchema', handler: sinon.match.func, config: config.transportConfig });
					calledOnce(spy);
					calledWith(spy, { message: { f: 'test1' }, context: { auth: 'testAuth' } });
				});

		});

	});

	describe('emitter', () => {

		let errorEvents = [];

		const listener = message => {
			errorEvents.push(message);
		};

		beforeEach(() => {
			Handler.emitter.addListener('error_event', listener);
		});

		afterEach(() => {
			Handler.emitter.removeListener('error_event', listener);
			errorEvents = [];
		});

		describe('should emit an error event', () => {

			it('on constructor error', () => {

				// given - when
				try {
					new Handler();
				} catch (err) {
					// doesn't matter
				}

				// then
				expect(errorEvents).to.include('Invalid parameter: config not an object');

			});

			it('on no function supplied to handle', () => {

				// then
				const verify = () => {
					expect(errorEvents).to.include('Please provide a valid callback function for event: \'test\'');
				};

				// giveb
				config.transport.subscribe.rejects(new Error('some error or other'));

				// when
				return new Handler(config).handle({ eventName: 'test' })
					.then(verify, verify);

			});

			it('on transport subscribe reject', () => {

				// then
				const verify = () => {
					expect(errorEvents).to.include('some error or other');
				};

				// giveb
				config.transport.subscribe.rejects(new Error('some error or other'));

				// when
				return new Handler(config).handle({ eventName: 'test', callback: _.noop })
					.then(verify, verify);

			});

		});

	});

});
