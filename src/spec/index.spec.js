'use strict';

const
	root = require('app-root-path'),
	proxyquire = require('proxyquire'),
	{ expect } = require('chai');

describe('index.js', () => {

	it('should load and expose apis correctly', () => {

		// given - when
		const
			mockServer = { mock: 'mockServer' },
			mockHandler = { mock: 'mockHandler' },
			mockPublisher = { mock: 'mockPublisher' },
			index = proxyquire(root + '/src/lib/index', {
				['./index/server']: mockServer,
				['./index/handler']: mockHandler,
				['./index/publisher']: mockPublisher
			});

		// then
		expect(index.Server).to.eql(mockServer);
		expect(index.Handler).to.eql(mockHandler);
		expect(index.Publisher).to.eql(mockPublisher);

	});

});
