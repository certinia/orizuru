/*
 * Copyright (c) 2017-2019, FinancialForce.com, inc
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
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import avsc, { Type } from 'avsc';
import { EventEmitter } from 'events';
import express from 'express';
import http from 'http';

import { RouteValidator } from '../../src/index/validator/route';

import { Options, Publisher, Server } from '../../src';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;

describe('index/server', () => {

	const Router: any = express.Router;

	let defaultOptions: Options.IServer;

	let schema1: Type;
	let schema2: Type;
	let schema3: Type;
	let schema4: Type;

	beforeEach(() => {

		defaultOptions = {
			port: 8080,
			transport: {
				close: sinon.stub().resolves(),
				connect: sinon.stub().resolves(),
				publish: sinon.stub().resolves(),
				subscribe: sinon.stub().resolves()
			}
		};

		schema1 = avsc.Type.forSchema({
			fields: [
				{ name: 'first', type: 'string' },
				{ name: 'last', type: 'string' }
			],
			name: 'FullName',
			namespace: 'com.example',
			type: 'record'
		});

		schema2 = avsc.Type.forSchema({
			fields: [
				{ name: 'first', type: 'string' },
				{ name: 'last', type: 'string' }
			],
			name: 'FullName',
			namespace: 'com.example.two',
			type: 'record'
		});

		schema3 = avsc.Type.forSchema({
			fields: [
				{ name: 'last', type: 'string' }
			],
			name: 'Surname',
			namespace: 'com.example',
			type: 'record'
		});

		schema4 = avsc.Type.forSchema({
			fields: [
				{ name: 'last', type: 'string' }
			],
			name: 'Surname',
			namespace: 'com.example.v1_0',
			type: 'record'
		});

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('constructor', () => {

		it('should emit an error event if the options are invalid', () => {

			// Given
			const options: any = {};

			sinon.spy(EventEmitter.prototype, 'emit');

			// When
			// Then
			expect(() => new Server(options)).to.throw(/^Missing required object parameter: transport\.$/g);

			expect(EventEmitter.prototype.emit).to.have.been.calledOnce;
			expect(EventEmitter.prototype.emit).to.have.been.calledWith(Server.ERROR);

		});

		it('should extend EventEmitter', () => {

			// Given
			// When
			const server = new Server(defaultOptions);

			// Then
			expect(server).to.be.an.instanceof(EventEmitter);

		});

		it('should add listeners to the publisher', () => {

			// Given
			sinon.stub(Publisher.prototype, 'on');

			// When
			new Server(defaultOptions);

			// Then
			expect(Publisher.prototype.on).to.have.been.calledTwice;
			expect(Publisher.prototype.on).to.have.been.calledWithExactly(Publisher.ERROR, sinon.match.func);
			expect(Publisher.prototype.on).to.have.been.calledWithExactly(Publisher.INFO, sinon.match.func);

		});

		it('should emit a Server error event for errors in the publisher', () => {

			// Given
			sinon.stub(Publisher.prototype, 'on').withArgs(Publisher.ERROR, sinon.match.func).yields('error');
			sinon.spy(Server.prototype, 'emit');

			// When
			const server = new Server(defaultOptions);

			// Then
			expect(server.emit).to.have.been.calledOnce;
			expect(server.emit).to.have.been.calledWithExactly(Server.ERROR, 'error');

		});

		it('should emit a Server info event for info events in the publisher', () => {

			// Given
			sinon.stub(Publisher.prototype, 'on').withArgs(Publisher.INFO, sinon.match.func).yields('info');
			sinon.spy(Server.prototype, 'emit');

			// When
			const server = new Server(defaultOptions);

			// Then
			expect(server.emit).to.have.been.calledOnce;
			expect(server.emit).to.have.been.calledWithExactly(Server.INFO, 'info');

		});

	});

	describe('addRoute', () => {

		it('should add a route to the server', () => {

			// Given
			sinon.spy(RouteValidator.prototype, 'validate');
			sinon.spy(EventEmitter.prototype, 'emit');
			sinon.stub(Router, 'post');

			const route = {
				endpoint: '/api/',
				method: 'post',
				middleware: [sinon.stub()],
				schema: schema1
			};

			let server = new Server(defaultOptions);

			sinon.spy(server, 'info');

			// When
			server = server.addRoute(route);

			// Then
			expect(server.info).to.have.been.calledTwice;
			expect(server.info).to.have.been.calledWithExactly('Creating router for namespace: /api/com/example/FullName.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.FullName (POST).');
			expect(Router.post).to.have.been.calledOnce;
			expect(Router.post).to.have.been.calledWithExactly('/', ...route.middleware, sinon.match.func);
			expect(RouteValidator.prototype.validate).to.have.been.calledOnce;

		});

		it('should add a route to the server with a version number', () => {

			// Given
			sinon.spy(RouteValidator.prototype, 'validate');
			sinon.spy(EventEmitter.prototype, 'emit');
			sinon.stub(Router, 'post');

			const route = {
				endpoint: '/api/',
				method: 'post',
				middleware: [sinon.stub()],
				pathMapper: (namespace: string) => {
					return namespace.replace(/\./g, '/').replace('_', '.');
				},
				schema: schema4
			};

			let server = new Server(defaultOptions);

			sinon.spy(server, 'info');

			// When
			server = server.addRoute(route);

			// Then
			expect(server.info).to.have.been.calledTwice;
			expect(server.info).to.have.been.calledWithExactly('Creating router for namespace: /api/com/example/v1.0/Surname.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.v1_0.Surname (POST).');
			expect(Router.post).to.have.been.calledOnce;
			expect(Router.post).to.have.been.calledWithExactly('/', ...route.middleware, sinon.match.func);
			expect(RouteValidator.prototype.validate).to.have.been.calledOnce;

		});

		it('should add multiple routes to the server', () => {

			// Given
			sinon.spy(RouteValidator.prototype, 'validate');
			sinon.spy(EventEmitter.prototype, 'emit');
			sinon.stub(Router, 'post');

			const route1 = {
				endpoint: '/',
				method: 'post',
				middleware: [sinon.stub()],
				schema: schema1
			};

			const route2 = {
				endpoint: '/',
				method: 'post',
				middleware: [sinon.stub()],
				schema: schema2
			};

			let server = new Server(defaultOptions);

			sinon.spy(server, 'info');

			// When
			server = server.addRoute(route1);
			server = server.addRoute(route2);

			// Then
			expect(server.info).to.have.callCount(4);
			expect(server.info).to.have.been.calledWithExactly('Creating router for namespace: /com/example/FullName.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.FullName (POST).');
			expect(server.info).to.have.been.calledWithExactly('Creating router for namespace: /com/example/two/FullName.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.two.FullName (POST).');
			expect(Router.post).to.have.been.calledTwice;
			expect(Router.post).to.have.been.calledWithExactly('/', ...route1.middleware, sinon.match.func);
			expect(Router.post).to.have.been.calledWithExactly('/', ...route2.middleware, sinon.match.func);
			expect(RouteValidator.prototype.validate).to.have.been.calledTwice;

		});

		it('should multiple routes to the server (with the same namespace on the same router)', () => {

			// Given
			sinon.spy(RouteValidator.prototype, 'validate');
			sinon.spy(EventEmitter.prototype, 'emit');
			sinon.stub(Router, 'post');

			const route1 = {
				endpoint: '/',
				method: 'post',
				middleware: [sinon.stub()],
				schema: schema1
			};

			const route2 = {
				endpoint: '/',
				method: 'post',
				middleware: [sinon.stub()],
				schema: schema3
			};

			let server = new Server(defaultOptions);

			sinon.spy(server, 'info');

			// When
			server = server.addRoute(route1);
			server = server.addRoute(route2);

			// Then
			expect(server.info).to.have.callCount(4);
			expect(server.info).to.have.been.calledWithExactly('Creating router for namespace: /com/example/FullName.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.FullName (POST).');
			expect(server.info).to.have.been.calledWithExactly('Creating router for namespace: /com/example/Surname.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.Surname (POST).');
			expect(Router.post).to.have.been.calledTwice;
			expect(Router.post).to.have.been.calledWithExactly('/', ...route1.middleware, sinon.match.func);
			expect(Router.post).to.have.been.calledWithExactly('/', ...route2.middleware, sinon.match.func);
			expect(RouteValidator.prototype.validate).to.have.been.calledTwice;

		});

		it('should add different methods for the same schema onto the same router', () => {

			// Given
			sinon.spy(RouteValidator.prototype, 'validate');
			sinon.spy(EventEmitter.prototype, 'emit');
			sinon.stub(Router, 'get');
			sinon.stub(Router, 'post');

			const route1 = {
				endpoint: '/',
				method: 'get',
				middleware: [sinon.stub()],
				schema: schema1
			};

			const route2 = {
				endpoint: '/',
				method: 'post',
				middleware: [sinon.stub()],
				schema: schema1
			};

			let server = new Server(defaultOptions);

			sinon.spy(server, 'info');

			// When
			server = server.addRoute(route1);
			server = server.addRoute(route2);

			// Then
			expect(server.info).to.have.been.calledThrice;
			expect(server.info).to.have.been.calledWithExactly('Creating router for namespace: /com/example/FullName.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.FullName (POST).');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.FullName (GET).');
			expect(Router.get).to.have.been.calledOnce;
			expect(Router.get).to.have.been.calledWithExactly('/', ...route1.middleware, sinon.match.func);
			expect(Router.post).to.have.been.calledOnce;
			expect(Router.post).to.have.been.calledWithExactly('/', ...route2.middleware, sinon.match.func);
			expect(RouteValidator.prototype.validate).to.have.been.calledTwice;

		});

	});

	describe('serverImpl', () => {

		it('should return the express server', () => {

			// Given
			const server = new Server(defaultOptions);

			// When
			const expressServer = server.serverImpl;

			// Then
			expect(expressServer).to.not.be.undefined;

		});

	});

	describe('publisher', () => {

		it('should return the publisher', () => {

			// Given
			const server = new Server(defaultOptions);

			// When
			const publisher = server.publisher;

			// Then
			expect(publisher).to.not.be.undefined;
			expect(publisher).to.be.an.instanceOf(EventEmitter);

		});

	});

	describe('listen', () => {

		it('should start the http server listening on the port specified in the options', async () => {

			// Given
			const httpServerStub = sinon.createStubInstance(http.Server);

			// express extends the http server so stub the createServer function,
			// return a listen stub
			sinon.stub(http, 'createServer').returns(httpServerStub as unknown as http.Server);

			const server = new Server(defaultOptions);

			// When
			await server.listen();

			// Then
			expect(defaultOptions.transport.connect).to.have.been.calledOnce;
			expect(defaultOptions.transport.connect).to.have.been.calledWithExactly();
			expect(httpServerStub.listen).to.have.been.calledOnce;
			expect(httpServerStub.listen).to.have.been.calledWithExactly(8080, sinon.match.func);

		});

		it('should emit an info event stating that the server is listening', async () => {

			// Given
			const httpServerStub = sinon.createStubInstance(http.Server);
			httpServerStub.listen.yields();

			// express extends the http server so stub the createServer function,
			// return a listen stub
			sinon.stub(http, 'createServer').returns(httpServerStub as unknown as http.Server);

			const server = new Server(defaultOptions);
			sinon.spy(server, 'info');

			// When
			await server.listen();

			// Then
			expect(defaultOptions.transport.connect).to.have.been.calledOnce;
			expect(defaultOptions.transport.connect).to.have.been.calledWithExactly();
			expect(httpServerStub.listen).to.have.been.calledOnce;
			expect(httpServerStub.listen).to.have.been.calledWithExactly(8080, sinon.match.func);
			expect(server.info).to.have.been.calledOnce;
			expect(server.info).to.have.been.calledWithExactly('Listening to new connections on port: 8080.');

		});

		it('should invoke the callback if specified after the server has started listening', async () => {

			// Given
			const httpServerStub = sinon.createStubInstance(http.Server);
			httpServerStub.listen.yields();

			// express extends the http server so stub the createServer function,
			// return a listen stub
			sinon.stub(http, 'createServer').returns(httpServerStub as unknown as http.Server);

			const server = new Server(defaultOptions);
			sinon.spy(server, 'info');

			const callbackStub = sinon.stub();

			// When
			await server.listen(callbackStub);

			// Then
			expect(defaultOptions.transport.connect).to.have.been.calledOnce;
			expect(defaultOptions.transport.connect).to.have.been.calledWithExactly();
			expect(httpServerStub.listen).to.have.been.calledOnce;
			expect(httpServerStub.listen).to.have.been.calledWithExactly(8080, sinon.match.func);
			expect(server.info).to.have.been.calledOnce;
			expect(server.info).to.have.been.calledWithExactly('Listening to new connections on port: 8080.');
			expect(callbackStub).to.have.been.calledOnce;
			expect(callbackStub).to.have.been.calledWithExactly(server);

		});

	});

	describe('close', () => {

		it('should throw an error if the server has not started listening to connections', async () => {

			// Given
			const server = new Server(defaultOptions);

			// When
			// Then
			await expect(server.close()).to.be.rejectedWith('The server has not started listening to connections.');

		});

		it('should stop the http server listening', async () => {

			// Given
			const httpServerStub = sinon.createStubInstance(http.Server);
			httpServerStub.listen.returnsThis();

			// express extends the http server so stub the createServer function,
			// return a listen stub
			sinon.stub(http, 'createServer').returns(httpServerStub as unknown as http.Server);

			const server = new Server(defaultOptions);
			await server.listen();

			// When
			await server.close();

			// Then
			expect(httpServerStub.listen).to.have.been.calledOnce;
			expect(httpServerStub.listen).to.have.been.calledWithExactly(8080, sinon.match.func);
			expect(httpServerStub.close).to.have.been.calledOnce;
			expect(httpServerStub.close).to.have.been.calledWithExactly(sinon.match.func);

		});

		it('should close the transport', async () => {

			// Given
			const httpServerStub = sinon.createStubInstance(http.Server);
			httpServerStub.listen.returnsThis();
			httpServerStub.close.yields();

			// express extends the http server so stub the createServer function,
			// return a listen stub
			sinon.stub(http, 'createServer').returns(httpServerStub as unknown as http.Server);

			const server = new Server(defaultOptions);
			sinon.spy(server, 'info');
			await server.listen();

			// When
			await server.close();

			// Then
			expect(httpServerStub.listen).to.have.been.calledOnce;
			expect(httpServerStub.listen).to.have.been.calledWithExactly(8080, sinon.match.func);
			expect(httpServerStub.close).to.have.been.calledOnce;
			expect(httpServerStub.close).to.have.been.calledWithExactly(sinon.match.func);
			expect(defaultOptions.transport.close).to.have.been.calledOnce;
			expect(defaultOptions.transport.close).to.have.been.calledWithExactly();

		});

		it('should emit an info event stating that the server has stopped listening', async () => {

			// Given
			const httpServerStub = sinon.createStubInstance(http.Server);
			httpServerStub.listen.returnsThis();
			httpServerStub.close.yields();

			// express extends the http server so stub the createServer function,
			// return a listen stub
			sinon.stub(http, 'createServer').returns(httpServerStub as unknown as http.Server);

			const server = new Server(defaultOptions);
			sinon.spy(server, 'info');
			await server.listen();

			// When
			await server.close();

			// Then
			expect(httpServerStub.listen).to.have.been.calledOnce;
			expect(httpServerStub.listen).to.have.been.calledWithExactly(8080, sinon.match.func);
			expect(httpServerStub.close).to.have.been.calledOnce;
			expect(httpServerStub.close).to.have.been.calledWithExactly(sinon.match.func);
			expect(server.info).to.have.been.calledOnce;
			expect(server.info).to.have.been.calledWithExactly('Stopped listening to connections on port: 8080.');
			expect(defaultOptions.transport.close).to.have.been.calledOnce;
			expect(defaultOptions.transport.close).to.have.been.calledWithExactly();

		});

		it('should invoke the callback if specified after the server has stopped listening', async () => {

			// Given
			const httpServerStub = sinon.createStubInstance(http.Server);
			httpServerStub.listen.returnsThis();
			httpServerStub.close.yields();

			// express extends the http server so stub the createServer function,
			// return a listen stub
			sinon.stub(http, 'createServer').returns(httpServerStub as unknown as http.Server);

			const server = new Server(defaultOptions);
			sinon.spy(server, 'info');
			await server.listen();

			const callbackStub = sinon.stub();

			// When
			await server.close(callbackStub);

			// Then
			expect(httpServerStub.listen).to.have.been.calledOnce;
			expect(httpServerStub.listen).to.have.been.calledWithExactly(8080, sinon.match.func);
			expect(server.info).to.have.been.calledOnce;
			expect(server.info).to.have.been.calledWithExactly('Stopped listening to connections on port: 8080.');
			expect(defaultOptions.transport.close).to.have.been.calledOnce;
			expect(defaultOptions.transport.close).to.have.been.calledWithExactly();
			expect(callbackStub).to.have.been.calledOnce;
			expect(callbackStub).to.have.been.calledWithExactly(server);

		});

	});

	describe('set', () => {

		it('should set the specified setting on the server', () => {

			// Given
			const options: any = {
				server: {
					set: sinon.stub()
				},
				transport: {
					close: sinon.stub().resolves(),
					connect: sinon.stub().resolves(),
					publish: sinon.stub().resolves(),
					subscribe: sinon.stub().resolves()
				}
			};

			const server = new Server(options);

			// When
			server.set('setting', 'test');

			// Then
			expect(options.server.set).to.have.been.calledOnce;
			expect(options.server.set).to.have.been.calledWithExactly('setting', 'test');

		});

	});

	describe('set', () => {

		it('should use the specified middleware on the given path', () => {

			// Given
			const options: any = {
				server: {
					use: sinon.stub()
				},
				transport: {
					close: sinon.stub().resolves(),
					connect: sinon.stub().resolves(),
					publish: sinon.stub().resolves(),
					subscribe: sinon.stub().resolves()
				}
			};

			const middlewareStub: any = sinon.stub();

			const server = new Server(options);

			// When
			server.use('/', middlewareStub);

			// Then
			expect(options.server.use).to.have.been.calledOnce;
			expect(options.server.use).to.have.been.calledWithExactly('/', middlewareStub);

		});

		it('should use the specified middleware on the given path', () => {

			// Given
			const options: any = {
				server: {
					use: sinon.stub()
				},
				transport: {
					close: sinon.stub().resolves(),
					connect: sinon.stub().resolves(),
					publish: sinon.stub().resolves(),
					subscribe: sinon.stub().resolves()
				}
			};

			const middleware1Stub: any = sinon.stub();
			const middleware2Stub: any = sinon.stub();

			const server = new Server(options);

			// When
			server.use('/', middleware1Stub, middleware2Stub);

			// Then
			expect(options.server.use).to.have.been.calledOnce;
			expect(options.server.use).to.have.been.calledWithExactly('/', middleware1Stub, middleware2Stub);

		});

	});

});
