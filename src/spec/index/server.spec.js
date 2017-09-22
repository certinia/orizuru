'use strict';

const
	root = require('app-root-path'),
	{ expect } = require('chai'),

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
			expect(() => new Server(input)).to.throw('Schema name: testSchema schema could not be compiled.');

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

	});

});
