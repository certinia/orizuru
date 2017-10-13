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
	root = require('app-root-path'),
	chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),

	{ expect } = chai,

	{ catchEmitReject, catchEmitThrow } = require(root + '/src/lib/index/shared/catchEmitThrow');

chai.use(chaiAsPromised);

describe('index/shared/catchEmitThrow.js', () => {

	let mockEmitter, mockEmitterResults;

	beforeEach(() => {
		mockEmitterResults = {};
		mockEmitter = {
			emit: (key, val) => {
				mockEmitterResults[key] = val;
			}
		};
	});

	describe('catchEmitThrow', () => {

		it('should emit and throw if a function throws an error', () => {

			// given - when - then
			expect(() => catchEmitThrow(() => {
				throw new Error('err');
			}, 'path', mockEmitter)).to.throw('err');
			expect(mockEmitterResults).to.haveOwnProperty('path', 'err');

		});

		it('should do nothing if a function doesn\'t throw an error', () => {

			// given - when - then
			expect(catchEmitThrow(() => {
				return 5;
			}, 'path', mockEmitter)).to.eql(5);

		});

		it('should emit and throw if a string is passed in', () => {

			// given - when - then
			expect(() => catchEmitThrow('err', 'path', mockEmitter)).to.throw('err');
			expect(mockEmitterResults).to.haveOwnProperty('path', 'err');

		});

		it('should return undefined if something other than a function or string is passed in', () => {

			// given - when - then
			expect(catchEmitThrow({}, 'path', mockEmitter)).to.eql(undefined);

		});

	});

	describe('catchEmitReject', () => {

		it('should emit and return a rejecting promise if a promise rejects', () => {

			// given - when - then
			return expect(catchEmitReject(Promise.reject(new Error('err')), 'path', mockEmitter)).to.eventually.be.rejectedWith('err')
				.then(() => {
					expect(mockEmitterResults).to.haveOwnProperty('path', 'err');
				});

		});

		it('should return the promise if a promise resolves', () => {

			// given - when - then
			return expect(catchEmitReject(Promise.resolve('test'), 'a', mockEmitter)).to.eventually.eql('test');

		});

		it('should emit the return a rejecting promise if a string is passed in', () => {

			// given - when - then
			return expect(catchEmitReject('err', 'path', mockEmitter)).to.eventually.be.rejectedWith('err')
				.then(() => {
					expect(mockEmitterResults).to.haveOwnProperty('path', 'err');
				});

		});

		it('should return a promise resolving to undefined if something other than a promise or string is passed in', () => {

			// given - when - then
			return expect(catchEmitReject({}, 'path', mockEmitter)).to.eventually.eql(undefined);

		});

	});

});
