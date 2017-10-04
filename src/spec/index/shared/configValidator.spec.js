'use strict';

const
	root = require('app-root-path'),
	{ expect } = require('chai'),
	{ validate } = require(root + '/src/lib/index/shared/configValidator');

describe('index/shared/configValidator.js', () => {

	describe('send', () => {

		it('should throw an error if config is not an object', () => {

			//given - when - then
			expect(() => validate(null)).to.throw('Invalid parameter: config not an object');

		});

		it('should throw an error if config.transport is not an object', () => {

			//given - when - then
			expect(() => validate({})).to.throw('Invalid parameter: config.transport not an object');

		});

		it('should throw an error if config.transport.publish is not a function', () => {

			//given - when - then
			expect(() => validate({ transport: {} })).to.throw('Invalid parameter: config.transport.publish not an function');

		});

		it('should throw an error if config.transport.subscribe is not a function', () => {

			//given - when - then
			expect(() => validate({ transport: { publish: () => {} } })).to.throw('Invalid parameter: config.transport.subscribe not an function');

		});

		it('should return undefined if everything is ok', () => {

			//given - when - then
			expect(validate({
				transport: {
					publish: () => {},
					subscribe: () => {}
				}
			})).to.eql(undefined);

		});

	});

});
