'use strict';

const
	_ = require('lodash'),
	root = require('app-root-path'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire'),
	{ expect } = require('chai'),
	{ calledOnce, calledTwice, calledThrice, calledWith, notCalled } = sinon.assert,
	request = require('supertest'),

	serverPath = root + '/src/lib/index/server',
	Publisher = require(root + '/src/lib/index/publisher'),
	{ compileFromSchemaDefinition } = require(root + '/src/lib/index/shared/schema'),

	sandbox = sinon.sandbox.create(),
	restore = sandbox.restore.bind(sandbox);

describe('index/server.js', () => {

	let config;

	beforeEach(() => {
		config = {
			transport: {
				publish: _.noop,
				subscribe: _.noop
			},
			transportConfig: 'testTransportConfig'
		};
	});

	afterEach(restore);

	describe('constructor', () => {

		let expressMock, expressMockResult, bodyParserMock, helmetMock, serverUseSpy, Server;

		beforeEach(() => {
			serverUseSpy = sandbox.spy();
			expressMockResult = {
				use: serverUseSpy
			};
			expressMock = function () {
				return expressMockResult;
			};
			bodyParserMock = 'bodyParserMock';
			helmetMock = 'helmetMock';
			Server = proxyquire(serverPath, {
				express: expressMock,
				'body-parser': {
					json: () => bodyParserMock
				},
				helmet: () => helmetMock
			});
		});

		it('should construct a server', () => {

			// given
			const
				server = new Server(config),
				express = server.getServer();

			// when - then
			expect(express).to.eql(expressMockResult);

			calledTwice(serverUseSpy);
			calledWith(serverUseSpy, bodyParserMock);
			calledWith(serverUseSpy, helmetMock);

		});

	});

	describe('addRoute', () => {

		let expressMock, expressMockResult, expressMockRouterResult, serverUseSpy, serverRouterUseSpy, serverRouterPostSpy, Server;

		beforeEach(() => {
			serverUseSpy = sandbox.spy();
			serverRouterUseSpy = sandbox.spy();
			serverRouterPostSpy = sandbox.spy();
			expressMockResult = {
				use: serverUseSpy
			};
			expressMock = function () {
				return expressMockResult;
			};
			expressMockRouterResult = {
				use: serverRouterUseSpy,
				post: serverRouterPostSpy
			};
			expressMock.Router = function () {
				return expressMockRouterResult;
			};
			Server = proxyquire(serverPath, {
				express: expressMock
			});
		});

		it('should throw an exception if schemaNameToDefinition isn\'t an object', () => {

			// given
			const
				server = new Server(config),
				input = {
					schemaNameToDefinition: null
				};

			// when - then
			expect(() => server.addRoute(input)).to.throw('Server init argument must be an object of: schemaName -> avroSchema.');

		});

		it('should throw an exception if schemaNameToDefinition values aren\'t valid schemas', () => {

			// given
			const
				server = new Server(config),
				input = {
					schemaNameToDefinition: {
						testSchema: []
					}
				};

			// when - then
			expect(() => server.addRoute(input)).to.throw('Schema name: \'testSchema\' schema could not be compiled.');

		});

		it('should add a route if schemaNameToDefinition map is correct, with default route and middlewares', () => {

			// given
			const
				server = new Server(config),
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

			// when
			server.addRoute(input);

			// then
			notCalled(serverRouterUseSpy);
			calledOnce(serverRouterPostSpy);
			calledWith(serverRouterPostSpy, '/:schemaName', sinon.match.func);
			calledThrice(serverUseSpy);
			calledWith(serverUseSpy, sinon.match.func);
			calledWith(serverUseSpy, sinon.match.func);
			calledWith(serverUseSpy, '', expressMockRouterResult);

		});

		it('should add a route at custom endpoint if custom endpoint is provided', () => {

			// given
			const
				server = new Server(config),
				input = {
					schemaNameToDefinition: {
						testSchema: {
							type: 'record',
							fields: [{
								name: 'f',
								type: 'string'
							}]
						}
					},
					apiEndpoint: '/test'
				};

			// when
			server.addRoute(input);

			// then
			notCalled(serverRouterUseSpy);
			calledOnce(serverRouterPostSpy);
			calledWith(serverRouterPostSpy, '/:schemaName', sinon.match.func);
			calledThrice(serverUseSpy);
			calledWith(serverUseSpy, sinon.match.func);
			calledWith(serverUseSpy, sinon.match.func);
			calledWith(serverUseSpy, '/test', expressMockRouterResult);

		});

		it('should add a with middlewares if middlewares are provided', () => {

			// given
			const
				server = new Server(config),
				middleware = _.noop,
				input = {
					schemaNameToDefinition: {
						testSchema: {
							type: 'record',
							fields: [{
								name: 'f',
								type: 'string'
							}]
						}
					},
					middlewares: [middleware]
				};

			// when
			server.addRoute(input);

			// then
			calledOnce(serverRouterUseSpy);
			calledWith(serverRouterUseSpy, middleware);
			calledOnce(serverRouterPostSpy);
			calledWith(serverRouterPostSpy, '/:schemaName', sinon.match.func);
			calledThrice(serverUseSpy);
			calledWith(serverUseSpy, sinon.match.func);
			calledWith(serverUseSpy, sinon.match.func);
			calledWith(serverUseSpy, '', expressMockRouterResult);

		});

		it('should ignore middlewares that aren\'t functions', () => {

			// given
			const
				server = new Server(config),
				middleware = _.noop,
				input = {
					schemaNameToDefinition: {
						testSchema: {
							type: 'record',
							fields: [{
								name: 'f',
								type: 'string'
							}]
						}
					},
					middlewares: [middleware, 'a test']
				};

			// when
			server.addRoute(input);

			// then
			calledOnce(serverRouterUseSpy);
			calledWith(serverRouterUseSpy, middleware);
			calledOnce(serverRouterPostSpy);
			calledWith(serverRouterPostSpy, '/:schemaName', sinon.match.func);
			calledThrice(serverUseSpy);
			calledWith(serverUseSpy, sinon.match.func);
			calledWith(serverUseSpy, sinon.match.func);
			calledWith(serverUseSpy, '', expressMockRouterResult);

		});

	});

	describe('getServer', () => {

		describe('should return a server that', () => {

			let schema, server, publisherStub;

			beforeEach(() => {
				delete require.cache[require.resolve(serverPath)];
				const Server = require(serverPath);
				publisherStub = sandbox.stub(Publisher.prototype, 'publish');
				schema = {
					type: 'record',
					fields: [{
						name: 'f',
						type: 'string'
					}]
				};
				server = new Server(config).addRoute({
					schemaNameToDefinition: {
						testSchema1: schema
					},
					apiEndpoint: '/api'
				});
			});

			it('fails for an invalid schema route', () => {

				// given - when - then
				return request(server.getServer())
					.post('/api/testSchemaUnknown')
					.expect(400, 'No schema for \'/api/testSchemaUnknown\' found.');

			});

			it('should respond with 400 if publish rejects', () => {

				// given
				publisherStub.rejects(new Error('Error test'));

				// when - then
				return request(server.getServer())
					.post('/api/testSchema1')
					.send({
						f: 'test1'
					})
					.expect(400, 'Error test')
					.then(() => {
						calledOnce(publisherStub);
						calledWith(publisherStub, {
							eventName: '/api/testSchema1',
							schema: compileFromSchemaDefinition(schema),
							message: {
								f: 'test1'
							},
							context: undefined
						});
					});

			});

			it('should respond with 200 if publish resolves', () => {

				// given
				publisherStub.resolves();

				// when - then
				return request(server.getServer())
					.post('/api/testSchema1')
					.send({
						f: 'test1'
					})
					.expect(200, 'Ok.')
					.then(() => {
						calledOnce(publisherStub);
						calledWith(publisherStub, {
							eventName: '/api/testSchema1',
							schema: compileFromSchemaDefinition(schema),
							message: {
								f: 'test1'
							},
							context: undefined
						});
					});

			});

		});

	});

});
