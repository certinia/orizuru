'use strict';

module.exports = {
	type: 'record',
	fields: [
		{ name: 'contextSchema', type: 'string' },
		{ name: 'contextBuffer', type: 'bytes' },
		{ name: 'messageSchema', type: 'string' },
		{ name: 'messageBuffer', type: 'bytes' }
	]
};
