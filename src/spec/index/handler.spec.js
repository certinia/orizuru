'use strict';

const
	root = require('app-root-path'),
	chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	sinon = require('sinon'),
	{ expect } = chai,
	{ calledOnce, calledWith } = sinon.assert,

	avro = require('avsc'),
	Subscribe = require(root + '/src/lib/index/messaging/subscribe'),
	Handler = require(root + '/src/lib/index/handler');

chai.use(chaiAsPromised);

describe('index/handler.js', () => {

	describe('handle', () => {

		const
			sandbox = sinon.sandbox.create(),
			restore = sandbox.restore.bind(sandbox);

		let input, handlerInstance, handleStub;

		beforeEach(() => {
			input = {
				schemaNameToDefinition: {
					testSchema: {
						type: 'record',
						fields: [{
							name: 'f',
							type: 'string'
						}]
					}
				}
			};
			handlerInstance = new Handler(input);
			handleStub = sandbox.stub(Subscribe, 'handle');
		});

		afterEach(restore);

		it('should throw an exception if schema for name isn\'t found', () => {

			// given - when - then
			expect(() => handlerInstance.handle({ schemaName: null })).to.throw('Schema name: \'null\' not found.');

		});

		it('should throw an exception if a valid callback function is not supplied', () => {

			// given - when - then
			expect(() => handlerInstance.handle({ schemaName: 'testSchema', callback: null })).to.throw('Please provide a valid callback function for schema: \'testSchema\'');

		});

		it('should call subscribe handle with schemaName and the handler function wrapped in a helper to deserialize the message to its schema and return its result', () => {

			// given
			const spy = sandbox.spy();
			handleStub.callsFake(obj => {
				obj.handler({
					content: avro.Type.forSchema(input.schemaNameToDefinition.testSchema).toBuffer({
						f: 'test1'
					})
				});
				return Promise.resolve('a');
			});

			// when - then
			return expect(handlerInstance.handle({ schemaName: 'testSchema', callback: spy })).to.eventually.be.eql('a')
				.then(() => {
					calledOnce(handleStub);
					calledWith(handleStub, { schemaName: 'testSchema', handler: sinon.match.func });
					calledOnce(spy);
					calledWith(spy, { body: { f: 'test1' } });
				});
		});

	});

});
