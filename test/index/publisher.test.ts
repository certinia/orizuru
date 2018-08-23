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
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import avsc from 'avsc';
import { EventEmitter } from 'events';

import { Transport } from '../../src/index/transport/transport';
import { PublishFunctionValidator } from '../../src/index/validator/publishFunction';

import { Publisher } from '../../src/index/publisher';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;

describe('index/publisher.ts', () => {

	afterEach(() => {
		sinon.restore();
	});

	describe('constructor', () => {

		it('should emit an error event if the options are invalid', () => {

			// Given
			sinon.spy(EventEmitter.prototype, 'emit');

			const options: any = {};

			// When
			// Then
			expect(() => new Publisher(options)).to.throw(/^Missing required object parameter: transport\.$/g);

			expect(EventEmitter.prototype.emit).to.have.been.calledTwice;
			expect(EventEmitter.prototype.emit).to.have.been.calledWith('info_event', 'Creating publisher.');
			expect(EventEmitter.prototype.emit).to.have.been.calledWith('error_event');

		});

		it('should extend EventEmitter', () => {

			// Given
			const options: any = {
				transport: {
					publish: _.noop,
					subscribe: _.noop
				}
			};

			// When
			const publisher = new Publisher(options);

			// Then
			expect(publisher).to.be.an.instanceof(EventEmitter);

		});

	});

	describe('publish', () => {

		it('should publish a message', () => {

			// Given
			sinon.stub(PublishFunctionValidator.prototype, 'validate');
			sinon.spy(EventEmitter.prototype, 'emit');
			sinon.spy(Transport.prototype, 'encode');

			const options: any = {
				transport: {
					connect: sinon.stub().resolves(),
					publish: sinon.stub().resolves(),
					subscribe: sinon.stub().resolves()
				}
			};

			const publisher = new Publisher(options);

			const message = {
				message: {
					context: {
						user: {
							username: 'test@test.com'
						}
					},
					message: {
						first: 'First',
						last: 'Last'
					}
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

			sinon.spy(publisher, 'info');

			// When
			// Then
			return expect(publisher.publish(message))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(PublishFunctionValidator.prototype.validate).to.have.been.calledOnce;
					expect(Transport.prototype.encode).to.have.been.calledWith(message.schema, message.message);
					expect(publisher.info).to.have.been.calledOnce;
					expect(publisher.info).to.have.been.calledWith('Published com.example.FullName event.');
					expect(EventEmitter.prototype.emit).to.have.been.calledTwice;
					expect(EventEmitter.prototype.emit).to.have.been.calledWith('info_event', 'Creating publisher.');
					expect(EventEmitter.prototype.emit).to.have.been.calledWith('info_event', 'Published com.example.FullName event.');
				});

		});

		describe('should throw an error', () => {

			it('if no options is provided', () => {

				// Given
				sinon.stub(PublishFunctionValidator.prototype, 'validate').throws(new Error('Missing required object parameter.'));

				const options: any = {
					transport: {
						publish: sinon.stub().resolves(),
						subscribe: sinon.stub().resolves()
					}
				};

				const publisher = new Publisher(options);

				// When
				// Then
				return expect(publisher.publish(options)).to.eventually.be.rejectedWith(/^Missing required object parameter\.$/)
					.then(() => {
						expect(PublishFunctionValidator.prototype.validate).to.have.been.calledOnce;
					});

			});

			it('if the transport cannot be encoded', () => {

				// Given
				sinon.stub(PublishFunctionValidator.prototype, 'validate');
				sinon.stub(Transport.prototype, 'encode').throws(new Error('encoding error'));

				const options: any = {
					transport: {
						connect: sinon.stub().resolves(),
						publish: sinon.stub().resolves(),
						subscribe: sinon.stub().resolves()
					}
				};

				const publishMessage = {
					message: {
						message: 'test'
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

				const publisher = new Publisher(options);

				sinon.spy(publisher, 'error');

				// When
				// Then
				return expect(publisher.publish(publishMessage))
					.to.eventually.be.rejectedWith('Error encoding message for schema (com.example.FullName):\ninvalid value (undefined) for path (first) it should be of type (string)\ninvalid value (undefined) for path (last) it should be of type (string)')
					.then(() => {
						expect(PublishFunctionValidator.prototype.validate).to.have.been.calledOnce;
						expect(publisher.error).to.have.been.calledOnce;
					});

			});

			it('if the publishing the message fails', () => {

				// Given
				sinon.stub(PublishFunctionValidator.prototype, 'validate');
				sinon.spy(EventEmitter.prototype, 'emit');

				const expectedError = new Error('Failed to publish message.');

				const options: any = {
					transport: {
						connect: sinon.stub().resolves(),
						publish: sinon.stub().rejects(expectedError),
						subscribe: sinon.stub().resolves()
					}
				};

				const publishMessage = {
					message: {
						message: {
							first: 'Test',
							last: 'Tester'
						}
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

				const publisher = new Publisher(options);

				sinon.spy(publisher, 'error');

				// When
				// Then
				return expect(publisher.publish(publishMessage))
					.to.eventually.be.rejectedWith('Failed to publish message.')
					.then(() => {
						expect(PublishFunctionValidator.prototype.validate).to.have.been.calledOnce;
						expect(publisher.error).to.have.been.calledOnce;
						expect(publisher.error).to.have.been.calledWith('Error publishing message on transport.');
						expect(EventEmitter.prototype.emit).to.have.been.calledTwice;
						expect(EventEmitter.prototype.emit).to.have.been.calledWith('info_event', 'Creating publisher.');
						expect(EventEmitter.prototype.emit).to.have.been.calledWith('error_event', 'Error publishing message on transport.');
					});

			});

		});

	});

});
