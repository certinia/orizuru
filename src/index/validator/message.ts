/*
 * Copyright (c) 2017-2019, FinancialForce.com, inc
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

/**
 * @module validator/message
 */

import { AvroSchema } from '../..';

/**
 * Validates a message against the Apache Avro schema.
 */
export class MessageValidator {

	/**
	 * Validates a message.
	 * @param schema The [Apache Avro](https://avro.apache.org/) schema to validate.
	 * @param message The incoming message to validate.
	 */
	public validate(schema: AvroSchema, message: any) {

		const schemaErrors = new Array<string>();

		const valid = schema.isValid(message, {
			errorHook: (path: any, value: any, type: any) => {
				schemaErrors.push(`Invalid value (${value}) for path (${path.join()}) it should be of type (${type.typeName})`);
			}
		});

		if (!valid) {

			let errors = new Array<string>();
			errors.push(`Error validating message for schema (${schema.name})`);
			errors = errors.concat(schemaErrors);

			const errorMessage = errors.join('\n');
			throw new Error(errorMessage);

		}

	}

}
