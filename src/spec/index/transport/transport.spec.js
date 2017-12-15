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
	avsc = require('avsc'),
	chai = require('chai'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	fs = require('fs-extra'),

	expect = chai.expect,

	Transport = require('../../../lib/index/transport/transport'),

	sandbox = sinon.sandbox.create();

chai.use(sinonChai);

describe('index/transport/transport.js', () => {

	afterEach(() => {
		sandbox.restore();
	});

	describe('constructor', () => {

		it('should read the transport schema and store it in a property', () => {

			// Given
			sandbox.stub(fs, 'readJsonSync').returns(JSON.parse('{"namespace":"com.ffdc.orizuru.transport","name":"Transport","type":"record","fields":[{"name":"contextSchema","type":"string"},{"name":"contextBuffer","type":"bytes"},{"name":"messageSchema","type":"string"},{"name":"messageBuffer","type":"bytes"}]}'));
			sandbox.stub(avsc.Type, 'forSchema');

			// When
			const transport = new Transport();

			// Then
			expect(fs.readJsonSync).to.have.been.calledOnce;
			expect(avsc.Type.forSchema).to.have.been.calledOnce;
			expect(transport).to.have.property('compiledSchema');

		});

	});

});
