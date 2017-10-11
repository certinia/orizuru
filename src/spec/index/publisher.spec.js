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

	Publisher = require(root + '/src/lib/index/publisher'),
	{ compileFromSchemaDefinition } = require(root + '/src/lib/index/shared/schema'),
	{ toBuffer } = require(root + '/src/lib/index/shared/transport'),

	sandbox = sinon.sandbox.create(),
	restore = sandbox.restore.bind(sandbox);

chai.use(chaiAsPromised);

describe('index/publisher.js', () => {

	let config;

	beforeEach(() => {
		config = {
			transport: {
				publish: sandbox.stub(),
				subscribe: _.noop
			},
			transportConfig: 'testTransportConfig'
		};
	});

	afterEach(restore);

	describe('publish', () => {

		let publisherInstance;

		beforeEach(() => {
			publisherInstance = new Publisher(config);
		});

		it('should reject if event name is empty', () => {

			// given - when - then
			return expect(publisherInstance.publish({ eventName: '' })).to.eventually.be.rejectedWith('Event name must be an non empty string.');

		});

		it('should reject if it failes to compile a schema', () => {

			// given - when - then
			return expect(publisherInstance.publish({ eventName: 'test', schema: {} })).to.eventually.be.rejectedWith('Schema could not be compiled.');

		});

		it('should reject if message does not match schema', () => {

			// given - when - then
			return expect(publisherInstance.publish({
				eventName: 'test',
				schema: compileFromSchemaDefinition({
					type: 'record',
					fields: [{
						name: 'f',
						type: 'string'
					}]
				}),
				message: {
					f: 1
				}
			})).to.eventually.be.rejectedWith('Error encoding message for schema.');

		});

		it('should reject if transport publish rejects', () => {

			// given 
			config.transport.publish.rejects(new Error());

			//when - then
			return expect(publisherInstance.publish({
				eventName: 'test',
				schema: compileFromSchemaDefinition({
					type: 'record',
					fields: [{
						name: 'f',
						type: 'string'
					}]
				}),
				message: {
					f: 'test'
				}
			})).to.eventually.be.rejectedWith('Error publishing message on transport.').then(() => {
				calledOnce(config.transport.publish);
				calledWith(config.transport.publish, {
					eventName: 'test',
					buffer: toBuffer(compileFromSchemaDefinition({
						type: 'record',
						fields: [{
							name: 'f',
							type: 'string'
						}]
					}), {
						f: 'test'
					}),
					config: config.transportConfig
				});
			});
		});

		it('should resolve and publish if message matches schema', () => {

			// given 
			config.transport.publish.resolves('testResult');

			//when - then
			return expect(publisherInstance.publish({
				eventName: 'test',
				schema: compileFromSchemaDefinition({
					type: 'record',
					fields: [{
						name: 'f',
						type: 'string'
					}]
				}),
				message: {
					f: 'test'
				}
			})).to.eventually.eql('testResult').then(() => {
				calledOnce(config.transport.publish);
				calledWith(config.transport.publish, {
					eventName: 'test',
					buffer: toBuffer(compileFromSchemaDefinition({
						type: 'record',
						fields: [{
							name: 'f',
							type: 'string'
						}]
					}), {
						f: 'test'
					}),
					config: config.transportConfig
				});
			});

		});

		it('should resolve and publish message and optional context', () => {

			// given 
			config.transport.publish.resolves('testResult');

			//when - then
			return expect(publisherInstance.publish({
				eventName: 'test',
				schema: compileFromSchemaDefinition({
					type: 'record',
					fields: [{
						name: 'f',
						type: 'string'
					}]
				}),
				message: {
					f: 'test'
				},
				context: {
					someVar: 'someVal'
				}
			})).to.eventually.eql('testResult').then(() => {
				calledOnce(config.transport.publish);
				calledWith(config.transport.publish, {
					eventName: 'test',
					buffer: toBuffer(compileFromSchemaDefinition({
						type: 'record',
						fields: [{
							name: 'f',
							type: 'string'
						}]
					}), {
						f: 'test'
					}, {
						someVar: 'someVal'
					}),
					config: config.transportConfig
				});
			});

		});

	});

	describe('emitter', () => {

		let errorEvents = [];

		const listener = message => {
			errorEvents.push(message);
		};

		beforeEach(() => {
			Publisher.emitter.addListener('error_event', listener);
		});

		afterEach(() => {
			Publisher.emitter.removeListener('error_event', listener);
			errorEvents = [];
		});

		describe('should emit an error event', () => {

			it('on constructor error', () => {

				// given - when
				try {
					new Publisher();
				} catch (err) {
					// doesn't matter
				}

				// then
				expect(errorEvents).to.include('Invalid parameter: config not an object');

			});

		});

	});

});
