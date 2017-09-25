'use strict';

const
	_ = require('lodash'),
	avro = require('avsc');

module.exports = {
	compileSchemas: schemaNameToDefinition => {
		if (!_.isObject(schemaNameToDefinition)) {
			throw new Error('Server init argument must be an object of: schemaName -> avroSchema.');
		} else {
			_.each(schemaNameToDefinition, (value, key) => {
				try {
					schemaNameToDefinition[key] = avro.Type.forSchema(value);
				} catch (err) {
					throw new Error(`Schema name: '${key}' schema could not be compiled.`);
				}
			});
		}
	}
};
