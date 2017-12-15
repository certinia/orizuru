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
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	avsc = require('avsc'),
	express = require('express'),
	{ EventEmitter } = require('events'),
	RouteValidator = require('../../lib/index/validator/route'),

	expect = chai.expect,

	Server = require('../../lib/index/server'),

	sandbox = sinon.sandbox.create();

chai.use(sinonChai);

describe('index/server.js', () => {

	const
		schema1 = avsc.Type.forSchema({
			type: 'record',
			namespace: 'com.example',
			name: 'FullName',
			fields: [
				{ name: 'first', type: 'string' },
				{ name: 'last', type: 'string' }
			]
		}),
		schema2 = avsc.Type.forSchema({
			type: 'record',
			namespace: 'com.example.two',
			name: 'FullName',
			fields: [
				{ name: 'first', type: 'string' },
				{ name: 'last', type: 'string' }
			]
		}),
		schema3 = avsc.Type.forSchema({
			type: 'record',
			namespace: 'com.example',
			name: 'Surname',
			fields: [
				{ name: 'last', type: 'string' }
			]
		});

	afterEach(() => {
		sandbox.restore();
	});

	describe('constructor', () => {

		it('should emit an error event if the configuration is invalid', () => {

			// Given
			sandbox.spy(EventEmitter.prototype, 'emit');

			// When
			// Then
			expect(() => new Server({})).to.throw(/^Missing required object parameter: transport\.$/g);

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
				server = new Server(config);

			// Then
			expect(server).to.be.an.instanceof(EventEmitter);

		});

	});

	describe('addRoute', () => {

		it('should add a route to the server', () => {

			// Given
			sandbox.stub(RouteValidator.prototype, 'validate');
			sandbox.spy(EventEmitter.prototype, 'emit');
			sandbox.stub(express.Router, 'use');

			const
				config = {
					transport: {
						publish: sandbox.stub().resolves(),
						subscribe: sandbox.stub().resolves()
					}
				},
				route = {
					endpoint: '/api/',
					method: 'post',
					middleware: [sandbox.stub()],
					schema: schema1
				};

			let server = new Server(config);

			sandbox.spy(server, 'log');

			// When
			server = server.addRoute(route);

			// Then
			expect(server.log).to.have.been.calledTwice;
			expect(server.log).to.have.been.calledWith('Creating router for namespace: /api/com/example.');
			expect(server.log).to.have.been.calledWith('Adding route: com.example.FullName.');
			expect(_.size(server.router_configuration)).to.eql(1);
			expect(server.route_configuration).to.eql({ '/api/com/example': { FullName: schema1 } });
			expect(express.Router.use).to.have.been.calledWith(route.middleware[0]);
			expect(RouteValidator.prototype.validate).to.have.been.calledOnce;

		});

		it('should multiple routes to the server (with different namespaces on different routers)', () => {

			// Given
			sandbox.stub(RouteValidator.prototype, 'validate');
			sandbox.spy(EventEmitter.prototype, 'emit');
			sandbox.stub(express.Router, 'use');

			const
				config = {
					transport: {
						publish: sandbox.stub().resolves(),
						subscribe: sandbox.stub().resolves()
					}
				},
				route1 = {
					endpoint: '/',
					method: 'post',
					middleware: [sandbox.stub()],
					schema: schema1
				},
				route2 = {
					endpoint: '/',
					method: 'post',
					middleware: [sandbox.stub()],
					schema: schema2
				};

			let server = new Server(config);

			sandbox.spy(server, 'log');

			// When
			server = server.addRoute(route1);
			server = server.addRoute(route2);

			// Then
			expect(server.log).to.have.callCount(4);
			expect(server.log).to.have.been.calledWith('Creating router for namespace: /com/example.');
			expect(server.log).to.have.been.calledWith('Adding route: com.example.FullName.');
			expect(server.log).to.have.been.calledWith('Creating router for namespace: /com/example/two.');
			expect(server.log).to.have.been.calledWith('Adding route: com.example.two.FullName.');
			expect(_.size(server.router_configuration)).to.eql(2);
			expect(server.route_configuration).to.eql({
				'/com/example': { FullName: schema1 },
				'/com/example/two': { FullName: schema2 }
			});
			expect(express.Router.use).to.have.been.calledWith(route1.middleware[0]);
			expect(express.Router.use).to.have.been.calledWith(route2.middleware[0]);
			expect(RouteValidator.prototype.validate).to.have.been.calledTwice;

		});

		it('should multiple routes to the server (with the same namespace on the same router)', () => {

			// Given
			sandbox.stub(RouteValidator.prototype, 'validate');
			sandbox.spy(EventEmitter.prototype, 'emit');
			sandbox.stub(express.Router, 'use');

			const
				config = {
					transport: {
						publish: sandbox.stub().resolves(),
						subscribe: sandbox.stub().resolves()
					}
				},
				route1 = {
					endpoint: '/',
					method: 'post',
					middleware: [sandbox.stub()],
					schema: schema1
				},
				route2 = {
					endpoint: '/',
					method: 'post',
					middleware: [sandbox.stub()],
					schema: schema3
				};

			let server = new Server(config);

			sandbox.spy(server, 'log');

			// When
			server = server.addRoute(route1);
			server = server.addRoute(route2);

			// Then
			expect(server.log).to.have.been.calledThrice;
			expect(server.log).to.have.been.calledWith('Creating router for namespace: /com/example.');
			expect(server.log).to.have.been.calledWith('Adding route: com.example.FullName.');
			expect(server.log).to.have.been.calledWith('Adding route: com.example.Surname.');
			expect(_.size(server.router_configuration)).to.eql(1);
			expect(server.route_configuration).to.eql({
				'/com/example': {
					FullName: schema1,
					Surname: schema3
				}
			});
			expect(express.Router.use).to.have.been.calledWith(route1.middleware[0]);
			expect(RouteValidator.prototype.validate).to.have.been.calledTwice;

		});

	});

	describe('getServer', () => {

		it('should return the express server', () => {

			// Given
			const
				config = {
					transport: {
						publish: sandbox.stub().resolves(),
						subscribe: sandbox.stub().resolves()
					}
				},

				server = new Server(config),

				// When
				expressServer = server.getServer();

			// Then
			expect(expressServer).to.not.be.undefined;

		});

	});

	describe('getPublisher', () => {

		it('should return the publisher', () => {

			// Given
			const
				config = {
					transport: {
						publish: sandbox.stub().resolves(),
						subscribe: sandbox.stub().resolves()
					}
				},

				server = new Server(config),

				// When
				publisher = server.getPublisher();

			// Then
			expect(publisher).to.not.be.undefined;
			expect(publisher).to.be.an.instanceOf(EventEmitter);

		});

	});

});
