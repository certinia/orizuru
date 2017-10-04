'use strict';

const
	_ = require('lodash'),

	validate = (config) => {
		if (config == null || !_.isObject(config)) {
			throw new Error('Invalid parameter: config not an object');
		}
		if (config.transport == null || !_.isObject(config.transport)) {
			throw new Error('Invalid parameter: config.transport not an object');
		}
		if (!_.isFunction(config.transport.publish)) {
			throw new Error('Invalid parameter: config.transport.publish not an function');
		}
		if (!_.isFunction(config.transport.subscribe)) {
			throw new Error('Invalid parameter: config.transport.subscribe not an function');
		}
	};

module.exports = {
	validate
};
