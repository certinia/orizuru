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

/**
 * A CHECKOUT request can be applied to a checked-in version-controlled resource to allow modifications
 * to the content and dead properties of that version-controlled resource.
 */
export const CHECKOUT: string = 'checkout';

/**
 * The COPY method creates a duplicate of the source resource identified by the Request-URI,
 * in the destination resource identified by the URI in the Destination header.
 * The Destination header MUST be present. The exact behavior of the COPY method 
 * depends on the type of the source resource.
 */
export const COPY: string = 'copy';
export const DELETE: string = 'delete';

/**
 * The GET method requests transfer of a current selected representation for the target resource.
 * GET is the primary mechanism of information retrieval and the focus of almost all performance optimizations.
 * Hence, when people speak of retrieving some identifiable information via HTTP, they are generally referring to making a GET request.
 *
 * {@link https://tools.ietf.org/html/rfc7231#page-24}
 */
export const GET: string = 'get';

/**
 * The HEAD method asks for a response identical to that of a GET request, but without the response body.
 */
export const HEAD: string = 'head';
export const LOCK: string = 'lock';
export const MERGE: string = 'merge';
export const MKACTIVITY: string = 'mkactivity';
export const MKCOL: string = 'mkcol';
export const MOVE: string = 'move';
export const M_SEARCH: string = 'm-search';
export const NOTIFY: string = 'notify';
export const OPTIONS: string = 'options';
export const PATCH: string = 'patch';

/**
 * The POST method is used to submit an entity to the specified resource, often causing a change in state or side effects on the server.
 */
export const POST: string = 'post';
export const PURGE: string = 'purge';
export const PUT: string = 'put';
export const REPORT: string = 'report';
export const SEARCH: string = 'search';
export const SUBSCRIBE: string = 'subscribe';
export const TRACE: string = 'trace';
export const UNLOCK: string = 'unlock';
export const UNSUBSCRIBE: string = 'unsubscribe';
