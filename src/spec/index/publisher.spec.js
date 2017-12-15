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
	chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	avsc = require('avsc'),
	{ EventEmitter } = require('events'),
	PublisherValidator = require('../../lib/index/validator/publisher'),

	expect = chai.expect,

	Publisher = require('../../lib/index/publisher'),

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('index/publisher.js', () => {

	afterEach(() => {
		sandbox.restore();
	});

	describe('constructor', () => {

		it('should emit an error event if the configuration is invalid', () => {

			// Given
			sandbox.spy(EventEmitter.prototype, 'emit');

			// When
			// Then
			expect(() => new Publisher({})).to.throw(/^Missing required object parameter: transport\.$/g);

			expect(EventEmitter.prototype.emit).to.have.been.calledOnce;

		});

		it('should extend EventEmitter', () => {

			// Given
			const
				config = {
					transport: {
						publish: _.noop,
						subscribe: _.noop
					}
				},

				// When
				publisher = new Publisher(config);

			// Then
			expect(publisher).to.be.an.instanceof(EventEmitter);

		});

	});

	describe('publish', () => {

		it('should publish a message', () => {

			// Given
			sandbox.stub(PublisherValidator.prototype, 'validate');
			sandbox.spy(EventEmitter.prototype, 'emit');

			const
				config = {
					transport: {
						publish: sandbox.stub().resolves(),
						subscribe: sandbox.stub().resolves()
					}
				},
				publisher = new Publisher(config),
				message = {
					schema: avsc.Type.forSchema({
						type: 'record',
						namespace: 'com.example',
						name: 'FullName',
						fields: [
							{ name: 'first', type: 'string' },
							{ name: 'last', type: 'string' }
						]
					}),
					message: {
						first: 'First',
						last: 'Last'
					}
				};

			sandbox.spy(publisher, 'info');

			// When
			// Then
			return expect(publisher.publish(message))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(PublisherValidator.prototype.validate).to.have.been.calledOnce;
					expect(publisher.info).to.have.been.calledOnce;
					expect(publisher.info).to.have.been.calledWith('Published com.example.FullName event.');
					expect(EventEmitter.prototype.emit).to.have.been.calledOnce;
					expect(EventEmitter.prototype.emit).to.have.been.calledWith('info_event', 'Published com.example.FullName event.');
				});

		});

		describe('should throw an error', () => {

			it('if no config is provided', () => {

				// Given
				sandbox.stub(PublisherValidator.prototype, 'validate').throws(new Error('Missing required object parameter.'));

				const
					config = {
						transport: {
							publish: sandbox.stub().resolves(),
							subscribe: sandbox.stub().resolves()
						}
					},
					publisher = new Publisher(config);

				// When
				// Then
				expect(() => publisher.publish()).to.throw(/^Missing required object parameter\.$/);
				expect(PublisherValidator.prototype.validate).to.have.been.calledOnce;

			});

			it('if the transport cannot be encoded', () => {

				// Given
				sandbox.stub(PublisherValidator.prototype, 'validate');

				const
					config = {
						transport: {
							publish: sandbox.stub().resolves(),
							subscribe: sandbox.stub().resolves()
						}
					},
					publishMessage = {
						schema: avsc.Type.forSchema({
							type: 'record',
							namespace: 'com.example',
							name: 'FullName',
							fields: [
								{ name: 'first', type: 'string' },
								{ name: 'last', type: 'string' }
							]
						}),
						message: 'test'
					},
					publisher = new Publisher(config);

				sandbox.spy(publisher, 'error');

				// When
				// Then
				expect(() => publisher.publish(publishMessage)).to.throw(/^Error encoding message for schema \(com.example.FullName\):\ninvalid value \(test\) for path \(\) it should be of type \(record\)$/);
				expect(PublisherValidator.prototype.validate).to.have.been.calledOnce;
				expect(publisher.error).to.have.been.calledOnce;

			});

			it('if the publishing the message fails', () => {

				// Given
				sandbox.stub(PublisherValidator.prototype, 'validate');
				sandbox.spy(EventEmitter.prototype, 'emit');

				const
					expectedError = new Error('Failed to publish message.'),
					config = {
						transport: {
							publish: sandbox.stub().rejects(expectedError),
							subscribe: sandbox.stub().resolves()
						}
					},
					publishMessage = {
						schema: avsc.Type.forSchema({
							type: 'record',
							namespace: 'com.example',
							name: 'FullName',
							fields: [
								{ name: 'first', type: 'string' },
								{ name: 'last', type: 'string' }
							]
						}),
						message: {
							first: 'Test',
							last: 'Tester'
						}
					},
					publisher = new Publisher(config);

				sandbox.spy(publisher, 'error');

				// When
				// Then
				return expect(publisher.publish(publishMessage))
					.to.eventually.be.rejectedWith('Failed to publish message.')
					.then(() => {
						expect(PublisherValidator.prototype.validate).to.have.been.calledOnce;
						expect(publisher.error).to.have.been.calledOnce;
						expect(publisher.error).to.have.been.calledWith('Error publishing message on transport.');
						expect(EventEmitter.prototype.emit).to.have.been.calledOnce;
						expect(EventEmitter.prototype.emit).to.have.been.calledWith('error_event', 'Error publishing message on transport.');
					});

			});

		});

	});

});
