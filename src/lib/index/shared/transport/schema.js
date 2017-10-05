'use strict';

module.exports = {
	type: 'record',
	fields: [
		{ name: 'untypedSchema', type: 'string' },
		{ name: 'untypedBuffer', type: 'bytes' },
		{ name: 'typedSchema', type: 'string' },
		{ name: 'typedBuffer', type: 'bytes' }
	]
};
