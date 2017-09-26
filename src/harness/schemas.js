'use strict';

// schema names to avro schema
module.exports = {
	firstAndLastName: {
		type: 'record',
		fields: [
			{ name: 'auth', type: 'string' }, // from middleware
			{ name: 'firstName', type: 'string' },
			{ name: 'lastName', type: 'string' }
		]
	},
	ageAndDob: {
		type: 'record',
		fields: [
			{ name: 'auth', type: 'string' }, // from middleware
			{ name: 'age', type: 'string' },
			{ name: 'dob', type: 'string' }
		]
	}
};
