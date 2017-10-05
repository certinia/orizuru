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

	afterEach(restore);

	describe('publish', () => {

		let publisherInstance, config;

		beforeEach(() => {
			config = {
				transport: {
					publish: sandbox.stub(),
					subscribe: _.noop
				},
				transportConfig: 'testTransportConfig'
			};
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

});
