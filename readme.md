# Orizuru

[![Build Status](https://travis-ci.org/financialforcedev/orizuru.svg?branch=master)](https://travis-ci.org/financialforcedev/orizuru)

Orizuru is a library that streamlines strongly typed communication between Heroku dynos (or other processes).
It leverages [Apache Avro](https://avro.apache.org/docs/current/) for schema validation and communication.

## Install

```bash
npm install @financialforcedev/orizuru
```

## Usage

### Configuration

All Orizuru classes require reference to a transport layer. The transport layer governs how messages are published and
subscribed. We inject this as a class constructor configuration parameter.

```typescript
import { Server } from '@financialforcedev/orizuru';
import { Transport } from '@financialforcedev/orizuru-transport-rabbitmq';

const transport = new Transport({
    url: 'amqp://localhost'
});

const server = new Server({
    port: 8080,
    transport
});
```

The example above shows how to use our RabbitMQ transport layer with a `Server`. The same method is used with our other classes.

### Server

A Orizuru Server allows you combine Avro schemas with API POST endpoints to create webhooks that validate API post body content and publish events via your chosen transport layer implementation. POST bodies are automatically validated against the Avro schema they are paired with, so the consumer of your events always receives valid input if it is invoked.

```typescript
import { json, Server } from '@financialforcedev/orizuru';
import { Transport } from '@financialforcedev/orizuru-transport-rabbitmq';

const schema = {
    name: 'ageAndDob',
    type: 'record',
    fields: [
        { name: 'age', type: 'string' },
        { name: 'dob', type: 'string' }
    ]
};

const transport = new Transport({
    url: 'amqp://localhost'
});

const server = new Server({
    port: 8080,
    transport
});

server.addRoute({
    endpoint: '/api/path/',
    middleware: [
        json()
    ],
    schema
})

server.listen();
```

In the above example, a POST API for `/api/path/ageAndDob` is created on the server before it listens on port `8080`. The post body sent is validated against the schema, which requires `age` and `dob` string fields in the JSON body. If the validation succeeds, an event name passed to the transport layer will be the fully qualified name of the Avro schema type `ageAndDob`, along with an Avro serialised buffer of the POST body.

Additionally, if there is an object on the request called `orizuru`, e.g. `request.orizuru`, this will also be serialized and added to the buffer as `context`. This allows middleware to add context information to the event fired, e.g. session validation and credentials.

### Publisher

The Orizuru Publisher allows you to publish events directly from Node.js via a transport layer, with Avro. This can be useful for communication between worker processes that do not expose a Web API. Messages are validated against a supplied schema, and there is also the facility to supply untyped context information.

```typescript
import { IOrizuruMessage, Publisher } from '@financialforcedev/orizuru';
import { Transport } from '@financialforcedev/orizuru-transport-rabbitmq';

interface Message {
    age: string;
    dob: string;
}

interface Context extends Orizuru.Context {
    sessionId: string;
}

const schema = {
    namespace: 'foo',
    name: 'bar',
    type: 'record',
    fields: [
        { name: 'age', type: 'string' },
        { name: 'dob', type: 'string' }
    ]
};

const message: IOrizuruMessage<Context, Message>  = {
    context: {
        sessionId: '​​​​​9B055039660429865FD49FE65E7FEC4A89F9D20C5D398957C71AFF41091CC276​​​​​'
    },
    message: {
        age: 'fifty',
        dob: '07/01/1991'
    }
};

const transport = new Transport({
    url: 'amqp://localhost'
});

const publisher = new Publisher({
    transport
});

publisher.publish({ schema, message });
```

This example publishes an event named `foo.bar` with the `message` described. The `message` part is validated against the `schema`. The `context` object extends the `Orizuru.Context` interface, in this case containing a session id.

### Handler

The handler handles messages published by the `Server` or `Publisher`. It requires a schema name and a handler.

**NOTE:** The supplied callback to this handler should **always** handle errors.
This means it should never `throw` an exception, and any `promise` it returns should always have a `catch` block. Any errors thrown / rejecting promises returned will be **swallowed**.

```typescript
import { Handler, IOrizuruMessage } from '@financialforcedev/orizuru';
import { Transport } from '@financialforcedev/orizuru-transport-rabbitmq';

const schema = {
    namespace: 'foo',
    name: 'bar',
    type: 'record',
    fields: [
        { name: 'age', type: 'string' },
        { name: 'dob', type: 'string' }
    ]
};

const handler = async ({ message, context }: IOrizuruMessage<any, any>) => {
    console.log('handling messages from the server API');
    console.log(message);
    console.log(context);
}

const transport = new Transport({
    url: 'amqp://localhost'
});

const handlerInstance = new Handler({
    transport
})

Promise.all([
    handlerInstance.handle({ schema, handler })
]);
```

The handler can handle multiple events, with callbacks for each wired in. The input to the callback `{ message, context }` is auto deserialized, so you get the JS object represention of the API post body or the JS object published, along with the context added by server middleware or supplied to the publish function.

## API Docs

Click to view [TSDoc API documentation](http://htmlpreview.github.io/?https://github.com/financialforcedev/orizuru/blob/master/doc/index.html).
