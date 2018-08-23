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
import sinon, { SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';

import _ from 'lodash';

import { SchemaValidator } from '../../../src/index/validator/shared/schema';

import { HandlerFunctionValidator } from '../../../src/index/validator/handlerFunction';

chai.use(sinonChai);

const expect = chai.expect;

describe('index/validator/handlerFunction', () => {

	let handlerFunctionValidator: HandlerFunctionValidator;

	beforeEach(() => {
		handlerFunctionValidator = new HandlerFunctionValidator();
		sinon.stub(SchemaValidator.prototype, 'validate');
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('constructor', () => {

		it('should return the schema if it is valid (string format)', () => {

			// Given
			const config = {
				handler: _.noop,
				schema: '{"name":"com.example.FullName","type":"record","fields":[]}'
			};

			// When
			// Then
			expect(handlerFunctionValidator.validate(config)).to.eql(config);
			expect(SchemaValidator.prototype.validate).to.have.been.calledOnce;

		});

		describe('should throw an error', () => {

			it('if no config is provided', () => {

				// Given
				// When
				// Then
				expect(() => handlerFunctionValidator.validate(undefined)).to.throw(/^Missing required object parameter\.$/);
				expect(SchemaValidator.prototype.validate).to.not.have.been.called;

			});

			it('if config is not an object', () => {

				// Given
				// When
				// Then
				expect(() => handlerFunctionValidator.validate(2)).to.throw(/^Invalid parameter: 2 is not an object\.$/);
				expect(SchemaValidator.prototype.validate).to.not.have.been.called;

			});

			it('if no handler is provided', () => {

				// Given
				// When
				// Then
				expect(() => handlerFunctionValidator.validate({})).to.throw(/^Missing required function parameter: handler\.$/);
				expect(SchemaValidator.prototype.validate).to.not.have.been.called;

			});

			it('if the handler is not a function', () => {

				// Given
				const config = {
					handler: 2
				};
				// When
				// Then
				expect(() => handlerFunctionValidator.validate(config)).to.throw(/^Invalid parameter: handler is not a function\.$/);
				expect(SchemaValidator.prototype.validate).to.not.have.been.called;

			});

			it('if the schema is invalid', () => {

				// Given
				(SchemaValidator.prototype.validate as SinonStub).throws(new Error('invalid schema'));

				const config = {
					handler: _.noop
				};

				// When
				// Then
				expect(() => handlerFunctionValidator.validate(config)).to.throw(/^invalid schema$/);
				expect(SchemaValidator.prototype.validate).to.have.been.calledOnce;

			});

		});

	});

});
