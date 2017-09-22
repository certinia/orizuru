'use strict';

const
	root = require('app-root-path'),
	sinon = require('sinon'),
	{ expect } = require('chai'),
	{ calledOnce, calledWith } = sinon.assert,
	request = require('supertest'),

	Publish = require(root + '/src/lib/index/server/publish'),
	Server = require(root + '/src/lib/index/server');

describe('index/server.js', () => {

	describe('constructor', () => {

		it('should throw an exception if schemaNameToDefinition isn\'t an object', () => {

			// given
			const
				input = {
					schemaNameToDefinition: null
				};

			// when - then
			expect(() => new Server(input)).to.throw('Server init argument must be an object of: schemaName -> avroSchema.');

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
			expect(() => new Server(input)).to.throw('Schema name: \'testSchema\' schema could not be compiled.');

		});

		it('should construct a server if schemaNameToDefinition map is correct', () => {

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
			expect(new Server(input)).to.be.instanceof(Server);

		});

		describe('should construct a server that', () => {

			let server;

			beforeEach(() => {
				server = new Server({
					schemaNameToDefinition: {
						testSchema1: {
							type: 'record',
							fields: [{
								name: 'f',
								type: 'string'
							}]
						}
					}
				});
			});

			it('fails for an invalid schema', () => {

				// given - when - then
				return request(server.server)
					.post('/api/testSchemaUnknown')
					.expect(400, 'No schema for \'testSchemaUnknown\' found.');

			});

			it('fails for a valid schema with no post body', () => {

				// given - when - then
				return request(server.server)
					.post('/api/testSchema1')
					.expect(400, 'Error encoding post body for schema: \'testSchema1\'.');

			});

			describe('calls publish for a valid schema with a conforming post body and', () => {

				const
					sandbox = sinon.sandbox.create(),
					restore = sandbox.restore.bind(sandbox);

				beforeEach(() => {
					sandbox.stub(Publish, 'send');
				});

				afterEach(restore);

				it('fails if publish rejects', () => {

					// given 
					Publish.send.rejects();

					// when - then
					return request(server.server)
						.post('/api/testSchema1')
						.send({
							f: 'test'
						})
						.expect(400, 'Error propogating event for \'testSchema1\'.')
						.then(() => {
							calledOnce(Publish.send);
							calledWith(Publish.send, { schemaName: 'testSchema1' });
						});

				});

				it('succeeds if publish resolves', () => {

					// given
					Publish.send.resolves();

					// when - then
					return request(server.server)
						.post('/api/testSchema1')
						.send({
							f: 'test'
						})
						.expect(200, 'Ok.')
						.then(() => {
							calledOnce(Publish.send);
							calledWith(Publish.send, { schemaName: 'testSchema1' });
						});

				});

			});

		});

	});

});
