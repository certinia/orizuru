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
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import avsc from 'avsc';
import { EventEmitter } from 'events';
import express from 'express';
import _ from 'lodash';

import { RouteValidator } from '../../src/index/validator/route';

import { Server } from '../../src';

chai.use(sinonChai);

const expect = chai.expect;

describe('index/server', () => {

	const Router: any = express.Router;

	const schema1 = avsc.Type.forSchema({
		fields: [
			{ name: 'first', type: 'string' },
			{ name: 'last', type: 'string' }
		],
		name: 'FullName',
		namespace: 'com.example',
		type: 'record'
	});

	const schema2 = avsc.Type.forSchema({
		fields: [
			{ name: 'first', type: 'string' },
			{ name: 'last', type: 'string' }
		],
		name: 'FullName',
		namespace: 'com.example.two',
		type: 'record'
	});

	const schema3 = avsc.Type.forSchema({
		fields: [
			{ name: 'last', type: 'string' }
		],
		name: 'Surname',
		namespace: 'com.example',
		type: 'record'
	});

	const schema4 = avsc.Type.forSchema({
		fields: [
			{ name: 'last', type: 'string' }
		],
		name: 'Surname',
		namespace: 'com.example.v1_0',
		type: 'record'
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('constructor', () => {

		let transport: any;

		beforeEach(() => {
			transport = {
				close: _.noop,
				connect: _.noop,
				publish: _.noop,
				subscribe: _.noop
			}
		});

		it('should emit an error event if the options are invalid', () => {

			// Given
			const options: any = {};

			sinon.spy(EventEmitter.prototype, 'emit');

			// When
			// Then
			expect(() => new Server(options)).to.throw(/^Missing required object parameter: transport\.$/g);

			expect(EventEmitter.prototype.emit).to.have.been.calledTwice;
			expect(EventEmitter.prototype.emit).to.have.been.calledWithExactly('info_event', 'Creating server.');
			expect(EventEmitter.prototype.emit).to.have.been.calledWith('error_event');

		});

		it('should extend EventEmitter', () => {

			// Given
			const options: any = {
				transport
			};

			// When
			const server = new Server(options);

			// Then
			expect(server).to.be.an.instanceof(EventEmitter);

		});

		it('should bind the express use and set functions to the server', () => {

			// Given
			const options: any = {
				transport
			};

			const expressServer: any = express;

			sinon.spy(expressServer.application.set, 'bind');
			sinon.spy(expressServer.application.use, 'bind');

			// When
			const server = new Server(options);

			// Then
			expect(expressServer.application.set.bind).to.have.been.calledOnce;
			expect(expressServer.application.set.bind).to.have.been.calledWithExactly(server.getServer());
			expect(expressServer.application.use.bind).to.have.been.calledOnce;
			expect(expressServer.application.use.bind).to.have.been.calledWithExactly(server.getServer());

		});

	});

	describe('addRoute', () => {

		it('should add a route to the server', () => {

			// Given
			sinon.spy(RouteValidator.prototype, 'validate');
			sinon.spy(EventEmitter.prototype, 'emit');
			sinon.stub(Router, 'use');

			const options: any = {
				transport: {
					close: sinon.stub().resolves(),
					connect: sinon.stub().resolves(),
					publish: sinon.stub().resolves(),
					subscribe: sinon.stub().resolves()
				}
			};

			const route = {
				endpoint: '/api/',
				method: 'post',
				middleware: [sinon.stub()],
				schema: schema1
			};

			let server = new Server(options);

			sinon.spy(server, 'info');

			// When
			server = server.addRoute(route);

			// Then
			expect(server.info).to.have.been.calledTwice;
			expect(server.info).to.have.been.calledWithExactly('Creating router for namespace: /api/com/example.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.FullName.');
			expect(Router.use).to.have.been.calledWithExactly(route.middleware[0]);
			expect(RouteValidator.prototype.validate).to.have.been.calledOnce;

		});

		it('should add a route to the server with a version number', () => {

			// Given
			sinon.spy(RouteValidator.prototype, 'validate');
			sinon.spy(EventEmitter.prototype, 'emit');
			sinon.stub(Router, 'use');

			const options: any = {
				transport: {
					close: sinon.stub().resolves(),
					connect: sinon.stub().resolves(),
					publish: sinon.stub().resolves(),
					subscribe: sinon.stub().resolves()
				}
			};

			const route = {
				endpoint: '/api/',
				method: 'post',
				middleware: [sinon.stub()],
				pathMapper: (namespace: string) => {
					return namespace.replace(/\./g, '/').replace('_', '.');
				},
				schema: schema4
			};

			let server = new Server(options);

			sinon.spy(server, 'info');

			// When
			server = server.addRoute(route);

			// Then
			expect(server.info).to.have.been.calledTwice;
			expect(server.info).to.have.been.calledWithExactly('Creating router for namespace: /api/com/example/v1.0.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.v1_0.Surname.');
			expect(Router.use).to.have.been.calledWithExactly(route.middleware[0]);
			expect(RouteValidator.prototype.validate).to.have.been.calledOnce;

		});

		it('should multiple routes to the server (with different namespaces on different routers)', () => {

			// Given
			sinon.spy(RouteValidator.prototype, 'validate');
			sinon.spy(EventEmitter.prototype, 'emit');
			sinon.stub(Router, 'use');

			const options: any = {
				transport: {
					close: sinon.stub().resolves(),
					connect: sinon.stub().resolves(),
					publish: sinon.stub().resolves(),
					subscribe: sinon.stub().resolves()
				}
			};

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

			let server = new Server(options);

			sinon.spy(server, 'info');

			// When
			server = server.addRoute(route1);
			server = server.addRoute(route2);

			// Then
			expect(server.info).to.have.callCount(4);
			expect(server.info).to.have.been.calledWithExactly('Creating router for namespace: /com/example.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.FullName.');
			expect(server.info).to.have.been.calledWithExactly('Creating router for namespace: /com/example/two.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.two.FullName.');
			expect(Router.use).to.have.been.calledWithExactly(route1.middleware[0]);
			expect(Router.use).to.have.been.calledWithExactly(route2.middleware[0]);
			expect(RouteValidator.prototype.validate).to.have.been.calledTwice;

		});

		it('should multiple routes to the server (with the same namespace on the same router)', () => {

			// Given
			sinon.spy(RouteValidator.prototype, 'validate');
			sinon.spy(EventEmitter.prototype, 'emit');
			sinon.stub(Router, 'use');

			const options: any = {
				transport: {
					close: sinon.stub().resolves(),
					connect: sinon.stub().resolves(),
					publish: sinon.stub().resolves(),
					subscribe: sinon.stub().resolves()
				}
			};

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

			let server = new Server(options);

			sinon.spy(server, 'info');

			// When
			server = server.addRoute(route1);
			server = server.addRoute(route2);

			// Then
			expect(server.info).to.have.been.calledThrice;
			expect(server.info).to.have.been.calledWithExactly('Creating router for namespace: /com/example.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.FullName.');
			expect(server.info).to.have.been.calledWithExactly('Adding route: com.example.Surname.');
			expect(Router.use).to.have.been.calledWithExactly(route1.middleware[0]);
			expect(RouteValidator.prototype.validate).to.have.been.calledTwice;

		});

	});

	describe('getServer', () => {

		it('should return the express server', () => {

			// Given
			const options: any = {
				transport: {
					close: sinon.stub().resolves(),
					connect: sinon.stub().resolves(),
					publish: sinon.stub().resolves(),
					subscribe: sinon.stub().resolves()
				}
			};

			const server = new Server(options);

			// When
			const expressServer = server.getServer();

			// Then
			expect(expressServer).to.not.be.undefined;

		});

	});

	describe('getPublisher', () => {

		it('should return the publisher', () => {

			// Given
			const options: any = {
				transport: {
					close: sinon.stub().resolves(),
					connect: sinon.stub().resolves(),
					publish: sinon.stub().resolves(),
					subscribe: sinon.stub().resolves()
				}
			};

			const server = new Server(options);

			// When
			const publisher = server.getPublisher();

			// Then
			expect(publisher).to.not.be.undefined;
			expect(publisher).to.be.an.instanceOf(EventEmitter);

		});

	});

});
