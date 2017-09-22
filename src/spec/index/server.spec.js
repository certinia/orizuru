'use strict';

const
	root = require('app-root-path'),
	{ expect } = require('chai'),

	server = require(root + '/src/lib/index/server');

describe('index/server.js', () => {

	describe('init', () => {

		it('should throw an exception if schemaNameToDefinition isn\'t an object', () => {

			// given - when - then
			expect(server.init(null)).to.throw('Server init argument must be an object of: schemaName -> avroSchema.');

		});

		it('should throw an exception if schemaNameToDefinition keys aren\'t strings', () => {

			// given
			const f = Symbol();

			// when - then
			expect(server.init({
				[f]: {}
			})).to.throw('Schema name must be a string.');

		});

		it('should throw an exception if schemaNameToDefinition values aren\'t valid schemas', () => {

			expect(server.init({
				test: {}
			})).to.throw('Schema name must be a string.');

		});

	});
});
