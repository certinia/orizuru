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
 * @module server/routeMethod
 */

/**
 * _The DELETE method requests that the origin server remove the
 * association between the target resource and its current
 * functionality.  In effect, this method is similar to the rm command
 * in UNIX: it expresses a deletion operation on the URI mapping of the
 * origin server rather than an expectation that the previously
 * associated information be deleted._
 *
 * {@link https://tools.ietf.org/html/rfc7231#section-4.3.5}
 */
export const DELETE: string = 'delete';

/**
 * _The GET method requests transfer of a current selected representation
 * for the target resource.  GET is the primary mechanism of information
 * retrieval and the focus of almost all performance optimizations.
 * Hence, when people speak of retrieving some identifiable information
 * via HTTP, they are generally referring to making a GET request._
 *
 * {@link https://tools.ietf.org/html/rfc7231#section-4.3.1}
 */
export const GET: string = 'get';

/**
 * _The HEAD method is identical to GET except that the server MUST NOT
 * send a message body in the response (i.e., the response terminates at
 * the end of the header section).  The server SHOULD send the same
 * header fields in response to a HEAD request as it would have sent if
 * the request had been a GET, except that the payload header fields
 * (Section 3.3) MAY be omitted.  This method can be used for obtaining
 * metadata about the selected representation without transferring the
 * representation data and is often used for testing hypertext links for
 * validity, accessibility, and recent modification._
 *
 * {@link https://tools.ietf.org/html/rfc7231#section-4.3.2}
 */
export const HEAD: string = 'head';

/**
 * _The OPTIONS method requests information about the communication
 * options available for the target resource, at either the origin
 * server or an intervening intermediary.  This method allows a client
 * to determine the options and/or requirements associated with a
 * resource, or the capabilities of a server, without implying a
 * resource action._
 *
 * {@link https://tools.ietf.org/html/rfc7231#section-4.3.7}
 */
export const OPTIONS: string = 'options';

/**
 * _The PATCH method requests that a set of changes described in the
 * request entity be applied to the resource identified by the Request-
 * URI.  The set of changes is represented in a format called a "patch
 * document" identified by a media type.  If the Request-URI does not
 * point to an existing resource, the server MAY create a new resource,
 * depending on the patch document type (whether it can logically modify
 * a null resource) and permissions, etc._
 *
 * {@link https://tools.ietf.org/html/rfc5789}
 */
export const PATCH: string = 'patch';

/**
 * _The POST method requests that the target resource process the
 * representation enclosed in the request according to the resource's
 * own specific semantics.  For example, POST is used for the following
 * functions (among others):_
 * * _Providing a block of data, such as the fields entered into an HTML
 * form, to a data-handling process;_
 * * _Posting a message to a bulletin board, newsgroup, mailing list,
 * blog, or similar group of articles;_
 * * _Creating a new resource that has yet to be identified by the
 * origin server; and_
 * * _Appending data to a resource's existing representation(s)._
 *
 * {@link https://tools.ietf.org/html/rfc7231#section-4.3.4}
 */
export const POST: string = 'post';

/**
 * _The PUT method requests that the state of the target resource be
 * created or replaced with the state defined by the representation
 * enclosed in the request message payload.  A successful PUT of a given
 * representation would suggest that a subsequent GET on that same
 * target resource will result in an equivalent representation being
 * sent in a 200 (OK) response.  However, there is no guarantee that
 * such a state change will be observable, since the target resource
 * might be acted upon by other user agents in parallel, or might be
 * subject to dynamic processing by the origin server, before any
 * subsequent GET is received.  A successful response only implies that
 * the user agent's intent was achieved at the time of its processing by
 * the origin server._
 *
 * {@link https://tools.ietf.org/html/rfc7231#section-4.3.3}
 */
export const PUT: string = 'put';

/**
 * _The TRACE method requests a remote, application-level loop-back of
 * the request message.  The final recipient of the request SHOULD
 * reflect the message received, excluding some fields described below,
 * back to the client as the message body of a 200 (OK) response with a
 * Content-Type of "message/http" (Section 8.3.1 of [RFC7230]).  The
 * final recipient is either the origin server or the first server to
 * receive a Max-Forwards value of zero (0) in the request
 * (Section 5.1.2)._
 *
 * {@link https://tools.ietf.org/html/rfc7231#section-4.3.8}
 */
export const TRACE: string = 'trace';
