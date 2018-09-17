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

import { CommonValidator } from '../../../../src/index/validator/shared/common';

const expect = chai.expect;

describe('index/validator/shared/common', () => {

	describe('constructor', () => {

		describe('should validate the transport', () => {

			it('if transport is a plain object', () => {

				// Given
				const options: any = {
					transport: {
						close: _.noop,
						connect: _.noop,
						publish: _.noop,
						subscribe: _.noop
					}
				};

				// When
				// Then
				expect(new CommonValidator(options)).to.not.throw;

			});

			it('if transport has a constructor other than Object', () => {

				// Given

				class TestTransport {
					constructor() {
						// Cover these methods..
						this.publish();
						this.subscribe();
						this.close();
						this.connect();
					}

					public publish() {
						return;
					}

					public subscribe() {
						return;
					}

					public close() {
						return;
					}

					public connect() {
						return;
					}
				}

				const options: any = {
					transport: new TestTransport()
				};

				// When
				// Then
				expect(new CommonValidator(options)).to.not.throw;

			});

		});

		describe('should throw an error', () => {

			it('if no options are provided', () => {

				// Given
				const options: any = undefined;

				// When
				// Then
				expect(() => new CommonValidator(options)).to.throw(/^Missing required object parameter\.$/);

			});

			it('if options is not an object', () => {

				// Given
				const options: any = 2;

				// When
				// Then
				expect(() => new CommonValidator(options)).to.throw(/^Invalid parameter: 2 is not an object\.$/);

			});

			it('if no transport is provided', () => {

				// Given
				const options: any = {};

				// When
				// Then
				expect(() => new CommonValidator(options)).to.throw(/^Missing required object parameter: transport\.$/);

			});

			it('if the transport is not an object', () => {

				// Given
				const options: any = {
					transport: 2
				};
				// When
				// Then
				expect(() => new CommonValidator(options)).to.throw(/^Invalid parameter: transport is not an object\.$/);

			});

			it('if no transport publish function is provided', () => {

				// Given
				const options: any = {
					transport: {}
				};

				// When
				// Then
				expect(() => new CommonValidator(options)).to.throw(/^Missing required function parameter: transport\[publish\]\.$/);

			});

			it('if the transport publish is not a function', () => {

				// Given
				const options: any = {
					transport: {
						publish: 2
					}
				};

				// When
				// Then
				expect(() => new CommonValidator(options)).to.throw(/^Invalid parameter: transport\[publish\] is not a function\.$/);

			});

			it('if no transport subscribe function is provided', () => {

				// Given
				const options: any = {
					transport: {
						close: _.noop,
						connect: _.noop,
						publish: _.noop
					}
				};

				// When
				// Then
				expect(() => new CommonValidator(options)).to.throw(/^Missing required function parameter: transport\[subscribe\]\.$/);

			});

			it('if the transport subscribe is not a function', () => {

				// Given
				const options: any = {
					transport: {
						close: _.noop,
						connect: _.noop,
						publish: _.noop,
						subscribe: 2
					}
				};

				// When
				// Then
				expect(() => new CommonValidator(options)).to.throw(/^Invalid parameter: transport\[subscribe\] is not a function\.$/);

			});

			it('if no transport close function is provided', () => {

				// Given
				const options: any = {
					transport: {
						connect: _.noop,
						publish: _.noop,
						subscribe: _.noop
					}
				};

				// When
				// Then
				expect(() => new CommonValidator(options)).to.throw(/^Missing required function parameter: transport\[close\]\.$/);

			});

			it('if the transport close is not a function', () => {

				// Given
				const options: any = {
					transport: {
						close: 2,
						connect: _.noop,
						publish: _.noop,
						subscribe: _.noop
					}
				};

				// When
				// Then
				expect(() => new CommonValidator(options)).to.throw(/^Invalid parameter: transport\[close\] is not a function\.$/);

			});

			it('if no transport connect function is provided', () => {

				// Given
				const options: any = {
					transport: {
						close: _.noop,
						publish: _.noop,
						subscribe: _.noop
					}
				};

				// When
				// Then
				expect(() => new CommonValidator(options)).to.throw(/^Missing required function parameter: transport\[connect\]\.$/);

			});

			it('if the transport connect is not a function', () => {

				// Given
				const options: any = {
					transport: {
						close: _.noop,
						connect: 2,
						publish: _.noop,
						subscribe: _.noop
					}
				};

				// When
				// Then
				expect(() => new CommonValidator(options)).to.throw(/^Invalid parameter: transport\[connect\] is not a function\.$/);

			});

		});

	});

});
