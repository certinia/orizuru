/**
 * Copyright (c) 2017, FinancialForce.com, inc
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
 **/

'use strict';

const
	_ = require('lodash'),
	root = require('app-root-path'),
	{ expect } = require('chai'),
	{ validate } = require(root + '/src/lib/index/shared/configValidator');

describe('index/shared/configValidator.js', () => {

	describe('send', () => {

		it('should throw an error if config is not an object', () => {

			//given - when - then
			expect(() => validate(null)).to.throw('Invalid parameter: config not an object');

		});

		it('should throw an error if config.transport is not an object', () => {

			//given - when - then
			expect(() => validate({})).to.throw('Invalid parameter: config.transport not an object');

		});

		it('should throw an error if config.transport.publish is not a function', () => {

			//given - when - then
			expect(() => validate({ transport: {} })).to.throw('Invalid parameter: config.transport.publish not an function');

		});

		it('should throw an error if config.transport.subscribe is not a function', () => {

			//given - when - then
			expect(() => validate({ transport: { publish: _.noop } })).to.throw('Invalid parameter: config.transport.subscribe not an function');

		});

		it('should return undefined if everything is ok', () => {

			//given - when - then
			expect(validate({
				transport: {
					publish: _.noop,
					subscribe: _.noop
				}
			})).to.eql(undefined);

		});

	});

});
