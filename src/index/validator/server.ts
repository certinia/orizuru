/**
 * Copyright (c) 2017-2018, FinancialForce.com, inc
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 *   are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice,
 *      this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice,
 *      this list of conditions and the following disclaimer in the documentation
 *      and/or other materials provided with the distribution.
 * - Neither the name of the FinancialForce.com, inc nor the names of its contributors
 *      may be used to endorse or promote products derived from this software without
 *      specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 *  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
 *  THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 *  OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 *  OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import _ from 'lodash';
import { Options } from '../..';

/**
 * Validates the {@link Server} configuration.
 * @private
 */
export class ServerValidator {

	constructor(options: Options.IServer) {

		if (!options) {
			throw new Error('Missing required object parameter.');
		}

		if (!_.isPlainObject(options)) {
			throw new Error(`Invalid parameter: ${options} is not an object.`);
		}

		if (!options.transport) {
			throw new Error('Missing required object parameter: transport.');
		}

		if (!_.isObjectLike(options.transport)) {
			throw new Error('Invalid parameter: transport is not an object.');
		}

		if (!options.transport.publish) {
			throw new Error('Missing required function parameter: transport[publish].');
		}

		if (!_.isFunction(options.transport.publish)) {
			throw new Error('Invalid parameter: transport[publish] is not a function.');
		}

		if (!options.transport.subscribe) {
			throw new Error('Missing required function parameter: transport[subscribe].');
		}

		if (!_.isFunction(options.transport.subscribe)) {
			throw new Error('Invalid parameter: transport[subscribe] is not a function.');
		}

		if (!options.transport.close) {
			throw new Error('Missing required function parameter: transport[close].');
		}

		if (!_.isFunction(options.transport.close)) {
			throw new Error('Invalid parameter: transport[close] is not a function.');
		}

		if (!options.transport.connect) {
			throw new Error('Missing required function parameter: transport[connect].');
		}

		if (!_.isFunction(options.transport.connect)) {
			throw new Error('Invalid parameter: transport[connect] is not a function.');
		}

		return options;

	}

}
