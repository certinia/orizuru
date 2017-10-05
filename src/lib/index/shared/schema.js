'use strict';

const
	avro = require('avsc');

module.exports = {
	compileFromPlainObject: type => avro.Type.forValue(type),
	compileFromSchemaDefinition: json => avro.Type.forSchema(json)
};
