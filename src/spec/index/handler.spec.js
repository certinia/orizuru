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
	{ schemaForJson } = require(root + '/src/lib/index/shared/schema'),
	{ toTransport } = require(root + '/src/lib/index/shared/transport');

chai.use(chaiAsPromised);

describe('index/handler.js', () => {

	describe('handle', () => {

		const
			sandbox = sinon.sandbox.create(),
			restore = sandbox.restore.bind(sandbox);

		let handlerInstance, config;

		beforeEach(() => {
			config = {
				transport: {
					publish: _.noop,
					subscribe: sandbox.stub()
				},
				transportConfig: 'testTransportConfig'
			};
			handlerInstance = new Handler(config);
		});

		afterEach(restore);

		it('should throw an exception if a valid callback function is not supplied', () => {

			// given - when - then
			expect(() => handlerInstance.handle({ schemaName: 'testSchema', callback: null })).to.throw('Please provide a valid callback function for schema: \'testSchema\'');

		});

		it('should call subscribe handle with schemaName and the handler function wrapped in a helper to deserialize the message to its schema and return its result', () => {

			// given
			const spy = sandbox.spy();
			config.transport.subscribe.callsFake(obj => {
				obj.handler(toTransport(schemaForJson({
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
			return expect(handlerInstance.handle({ schemaName: 'testSchema', callback: spy })).to.eventually.be.eql('a')
				.then(() => {
					calledOnce(config.transport.subscribe);
					calledWith(config.transport.subscribe, { eventName: 'testSchema', handler: sinon.match.func, config: config.transportConfig });
					calledOnce(spy);
					calledWith(spy, { body: { f: 'test1' }, nozomi: { auth: 'testAuth' } });
				});
		});

	});

});
