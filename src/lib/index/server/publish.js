'use strict';

const send = ({ schemaName, buffer }) => {
	console.log(schemaName);
	console.log(buffer);
	return Promise.resolve();
};

module.exports = {
	send
};
