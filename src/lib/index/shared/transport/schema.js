'use strict';

module.exports = {
	type: 'record',
	fields: [
		{ name: 'nozomiSchema', type: 'string' },
		{ name: 'nozomiBuffer', type: 'bytes' },
		{ name: 'bodySchema', type: 'string' },
		{ name: 'bodyBuffer', type: 'bytes' }
	]
};
