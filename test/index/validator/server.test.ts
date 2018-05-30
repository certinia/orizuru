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

import chai from 'chai';
import _ from 'lodash';

import ServerValidator from '../../../src/index/validator/server';

const expect = chai.expect;

describe('index/validator/server.js', () => {

	describe('constructor', () => {

		it('should return the schema if it is valid', () => {

			// Given
			const config = {
				transport: {
					publish: _.noop,
					subscribe: _.noop
				}
			};

			// When
			// Then
			expect(new ServerValidator(config as any)).to.eql(config);

		});

		describe('should throw an error', () => {

			it('if no config is provided', () => {

				// Given
				// When
				// Then
				expect(() => new ServerValidator(undefined as any)).to.throw(/^Missing required object parameter\.$/);

			});

			it('if config is not an object', () => {

				// Given
				// When
				// Then
				expect(() => new ServerValidator(2 as any)).to.throw(/^Invalid parameter: 2 is not an object\.$/);

			});

			it('if no transport is provided', () => {

				// Given
				// When
				// Then
				expect(() => new ServerValidator({} as any)).to.throw(/^Missing required object parameter: transport\.$/);

			});

			it('if the transport is not an object', () => {

				// Given
				const config = {
					transport: 2
				};
				// When
				// Then
				expect(() => new ServerValidator(config as any)).to.throw(/^Invalid parameter: transport is not an object\.$/);

			});

			it('if no transport publish function is provided', () => {

				// Given
				const config = {
					transport: {}
				};

				// When
				// Then
				expect(() => new ServerValidator(config as any)).to.throw(/^Missing required function parameter: transport\[publish\]\.$/);

			});

			it('if the transport publish is not a function', () => {

				// Given
				const config = {
					transport: {
						publish: 2
					}
				};

				// When
				// Then
				expect(() => new ServerValidator(config as any)).to.throw(/^Invalid parameter: transport\[publish\] is not a function\.$/);

			});

			it('if no transport subscribe function is provided', () => {

				// Given
				const config = {
					transport: {
						publish: _.noop
					}
				};

				// When
				// Then
				expect(() => new ServerValidator(config as any)).to.throw(/^Missing required function parameter: transport\[subscribe\]\.$/);

			});

			it('if the transport subscribe is not a function', () => {

				// Given
				const config = {
					transport: {
						publish: _.noop,
						subscribe: 2
					}
				};

				// When
				// Then
				expect(() => new ServerValidator(config as any)).to.throw(/^Invalid parameter: transport\[subscribe\] is not a function\.$/);

			});

		});

	});

});
