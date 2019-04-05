# @financialforcedev/orizuru

## 9.3.1

- Rework and complete documentation
- Convert to using Jest for testing

## 9.3.0

- Updated IHandler, IPublisher and IServer interfaces to extend EventEmitter
- Added support for ErrorRequestHandler as middleware

## 9.2.0

- Update typescript configuration to target es2017

## 9.1.0

- Export the RequestHandler from express
- Export the ResponseWriter type
- Update the IServer, IPublisher and IHandler types to include the missing functions
- Update the lodash imports and use es2017 functions where appropriate
- Update tests for changes to sinon
- Remove fs-extra dependency
- Remove the npmignore file and update the package.json to package the correct files
- Remove the properties files

## 9.0.1

- Update all dependencies to latest versions
- Remove all references to `new Buffer()`
  - Use `Buffer.from()` instead to remove deprecation warnings

## 9.0.0

- The `addRoute` method can now add synchronous APIs
  - Set the `synchronous` property to `true` in the route options to do this
  - All incoming messages are still validated against the [Apache Avro](https://avro.apache.org/docs/current/) schema but are not published to a message queue
  - The validated request is stored in the body property of the request
  - Synchronous request logic should be added to the `responseWriter` property
- The routing mechanism for Orizuru has been updated so that each endpoint now uses a different express router
- Orizuru now expects a class for the transport layer
  - Each server, publisher and handler should have a different transport instance
  - The configuration for the transport can be provided in the constructor
  - Updated ITransport interface
  - Removed Orizuru.Transport.IConnect interface
- Addition of helper methods for `listen`, `close`, `set` and `use` to the Orizuru `Server`
  - By default, `close` also closes the transport layer
  - By default, `listen` starts the server listening for connections specified in the `Options`
- All Orizuru `Handler` and `Publisher` instances must now be initialised by calling the `init()` function. This initialises the connection
- The `getPublisher` and `getServer` functions have been replaced with property getters
- Added `Orizuru.Message` interface to the `IOrizuruMessage`
  - This acts as the base interface for all messages sent by Orizuru

- Events have now been converted to use symbols
- Add system tests to test core functionality
  - Addition of RabbitMQ docker image using the same version as Travis CI
  - System test coverage is now included in Travis builds
- Add nyc.opts file to clean up the package.json

- Fix a regression where the context Avro schema could contain anonymous types
- Documentation is now generated using the master branch for definition links

## 8.0.2

### FIXES

- Default the event name to the schema name when publishing a message

## 8.0.1

### FIXES

- Make sure that messages can be published if the context is empty

## 8.0.0

### BREAKING CHANGES

- Use generic types for the IOrizuruMessage
  - This will cause compile time errors even though there are no functional changes

### NEW FEATURES

- Add use and set functions to the server
- Export static function from express in the index

## 7.1.1

### FIXES

- Update all validators to allow for transport objects created by constructors other than Object

## 7.1.0

### NEW FEATURES

- Allow for transport objects created by constructors other than Object

## 7.0.0

### OTHER CHANGES

- Conversion to Typescript

## 6.1.1

### OTHER CHANGES

- Fix security advisories
- Relax versioning

## 6.1.0

### NEW FEATURES

- Allow customisation of the mapping from Avro schema namespace to URL path

## 6.0.1

### FIXES

- Make the subscribe handler wrapper async, and await the inner handler

## 6.0.0

### BREAKING CHANGES

- The server `addRoute` method has been updated to add each route separately
- The server `addGet` method has been removed
  - The `addRoute` allows you to specify the method as part of the route configuration
- The `Server`, `Publisher` and `Handler` now extend `EventEmitter`
  - Any cases of `Server.emitter`, `Publisher.emitter` and `Handler.emitter` should be changed to reference the instance

### NEW FEATURES

- Added the `npm init-project` command.
  - This command should be called before running any of the examples. It makes a local copy of the `run.properties` and `test.properties` files

### OTHER CHANGES

- The transport schema has been updated to an [Apache Avro](https://avro.apache.org/docs/current/) schema (`.avsc`) file
- Updated the JS documentation to use the Minami theme
- Removed the jsbeautifyrc file
  - We now use the beautify file specified in the eslint-config package
