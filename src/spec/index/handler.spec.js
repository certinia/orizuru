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

	describe('constructor', () => {

		it('should throw an exception if schemaNameToDefinition isn\'t an object', () => {

			// given
			const
				input = {
					schemaNameToDefinition: null
				};

			// when - then
			expect(() => new Handler(input)).to.throw('Server init argument must be an object of: schemaName -> avroSchema.');

		});

		it('should throw an exception if schemaNameToDefinition values aren\'t valid schemas', () => {

			// given
			const
				input = {
					schemaNameToDefinition: {
						testSchema: []
					}
				};

			// when - then
			expect(() => new Handler(input)).to.throw('Schema name: \'testSchema\' schema could not be compiled.');

		});

		it('should construct a handler if schemaNameToDefinition map is correct', () => {

			// given
			const
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

			// when - then
			expect(new Handler(input)).to.be.instanceof(Handler);

		});

	});

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
