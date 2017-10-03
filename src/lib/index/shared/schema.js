'use strict';

const
	avro = require('avsc');

module.exports = {
	schemaForType: type => avro.Type.forValue(type),
	schemaForJson: json => avro.Type.forSchema(json)
};
