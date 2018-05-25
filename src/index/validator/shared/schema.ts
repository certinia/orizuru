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

import { Type } from 'avsc';
import _ from 'lodash';

/**
 * Parses the schema from a JSON string.
 * @private
 */
function parseSchema(schema: string) {

	try {
		return JSON.parse(schema);
	} catch (error) {
		throw new Error(`Invalid Avro Schema. Failed to parse JSON string: ${schema}.`);
	}

}

/**
 * Compiles the schema using the {@link https://www.npmjs.com/package/avsc|NPM avsc srcrary}.
 * @private
 */
function compileSchema(uncompiledSchema: any) {

	try {
		return Type.forSchema(uncompiledSchema);
	} catch (error) {
		throw new Error(`Invalid Avro Schema. Schema error: ${error.message}.`);
	}

}

export function validate(config: any) {

	if (!config.schema) {
		throw new Error('Missing required avro-schema parameter: schema.');
	}

	if (_.isString(config.schema)) {
		const parsedSchema = parseSchema(config.schema);
		config.schema = compileSchema(parsedSchema);
	} else if (_.isPlainObject(config.schema)) {
		config.schema = compileSchema(config.schema);
	} else if (_.hasIn(config.schema, 'toJSON') && _.hasIn(config.schema, 'toBuffer')) {
		// Already have a compiled schema
	} else {
		throw new Error(`Invalid Avro Schema. Unexpected value type: ${typeof config.schema}.`);
	}

	if (!config.schema.name) {
		throw new Error('Missing required string parameter: schema[name].');
	}

	return config;

}
