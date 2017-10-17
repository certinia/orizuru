# Orizuru

[![NSP Status](https://nodesecurity.io/orgs/ffres/projects/4bb1b8ba-4d1b-4960-b5ad-3e1cf4e4e154/badge)](https://nodesecurity.io/orgs/ffres/projects/4bb1b8ba-4d1b-4960-b5ad-3e1cf4e4e154)

Orizuru is a library that streamlines strongly typed communication between Heroku dynos (or other processes).
It leverages [Apache Avro](https://avro.apache.org/) for schema validation and communication.


## Install

```
$ npm install @financialforcedev/orizuru
```


## Usage

### Configuration

All Orizuru classes require reference to a transport layer. The transport layer governs how messages are published and 
subscribed to. We inject this as a class constructor configuration parameter.

	const
		{ Server } = require('@financialforcedev/orizuru'),
		transport = require('@financialforcedev/orizuru-transport-rabbitmq'),
		transportConfig = {
			cloudamqpUrl: 'amqp://localhost'
		},

		serverInstance = new Server({ transport, transportConfig });

The example above shows how to use our RabbitMQ transport layer with a ```Server```. The same method is used with our other classes.
The ```transportConfig``` is passed through to the transport layer via its function APIs, in the case of the RabbitMQ transport, we require
the ```cloudamqpUrl``` field.

### Server

A Orizuru Server allows you combine Avro schemas with API POST endpoints to create webhooks that validate API post body content and publish events
via your chosen transport layer implementation. POST bodies are automatically validated against the Avro schema they are paired with, so the consumer
of your events always receives valid input if it is invoked.

	const
		{ Server } = require('@financialforcedev/orizuru'),
		...
		serverInstance = new Server({ transport, transportConfig }),

		schemaNameToDefinition = {
			ageAndDob: {
				type: 'record',
				fields: [
					{ name: 'age', type: 'string' },
					{ name: 'dob', type: 'string' }
				]
			}
		},

		middlewares = [],

		apiEndpoint = '/api/path';
	
	serverInstance.addRoute({ schemaNameToDefinition, apiEndpoint, middlewares });

	let expressServer = serverInstance.getServer();

	expressServer.listen(8080);

As you can see from the above example, the ```getServer()``` method returns an express server, where you can add your own routes, etc, before listening to a port. This example would create a POST API for ```/api/path/ageAndDob```. The post body you send would be validated against the schema, requiring ```age``` and ```dob``` string fields in its JSON. If the validation succeeds, an event name passed to the transport layer will be ```/api/path/ageAndDob```, along with an Avro serialised buffer of the POST body.

Additionally, if there is an object on the express request called ```orizuru```, e.g. ```request.orizuru```, this will also be serialized and added to the buffer as ```context```. This allows middlewares to add context information to the event fired, e.g. session validation and credentials.

### Publisher

The Orizuru Publisher allows you to publish events directly from Node.js via a transport layer, with Avro. This can be useful for communication between worker processes that do not expose a Web API. Messages are validated against a supplied schema, and there is also the facility to supply untyped context information.

	const
		{ Publisher } = require('@financialforcedev/orizuru'),
		...
		publisherInstance = new Publisher({ transport, transportConfig }),

		eventName = 'testEvent',

		schema = {
			type: 'record',
			fields: [
				{ name: 'age', type: 'string' },
				{ name: 'dob', type: 'string' }
			]
		},

		message = {
			age: 'fifty',
			dob: '07/01/1991'
		},

		context = {
			anything: 'something untyped'
		};

	return publisherInstance.publish({ eventName, schema, message, context }); //promise

This example publishes an event named 'testEvent' with the ```message``` described. The ```message``` is validated against the ```schema```. The ```context``` object is unvalidated and can contain anything.

### Handler

The handler handles messages published by the ```Server``` or ```Publisher```. It requires an event name and a callback.

**NOTE:** The supplied callback to this handler should **always** handle errors.
This means it should never ```throw``` an exception, and any ```promise``` it returns should always have a ```catch``` block. Any errors thrown / rejecting promises returned will be **swallowed**.

	const
		{ Handler } = require('@financialforcedev/orizuru'),
		...
		handlerInstance = new Handler({ transport, transportConfig }),

		eventName1 = '/api/path/ageAndDob',
		eventName2 = 'testEvent',

		callback1 = ({ message, context }) => {
			console.log('handling messages from the server API');
			console.log(message);
			console.log(context);
		},
		
		callback2 = ({ message, context }) => {
			console.log('handling messages from the publisher event');
			console.log(message);
			console.log(context);
		};

	return Promise.all([
		handlerInstance.handle({ eventName: eventName1, callback: callback1 }),
		handlerInstance.handle({ eventName: eventName2, callback: callback2 })
	]); // 'handle' returns a promise

The handler can handle multiple events, with callbacks for each wired in. The input to the callback ```{ message, context }``` is auto deserialized, so you get the JS object represention of the API post body or the JS object published, along with the context added by server middlewares or supplied to the publish function.


## API Docs

Click to view [JSDoc API documentation](http://htmlpreview.github.io/?https://github.com/financialforcedev/orizuru/blob/master/doc/index.html).