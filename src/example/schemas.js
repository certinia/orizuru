'use strict';

// schema names to avro schemas
module.exports = {
	firstAndLastName: {
		type: 'record',
		fields: [
			{ name: 'firstName', type: 'string' },
			{ name: 'lastName', type: 'string' }
		]
	},
	ageAndDob: {
		type: 'record',
		fields: [
			{ name: 'age', type: 'string' },
			{ name: 'dob', type: 'string' }
		]
	}
};
