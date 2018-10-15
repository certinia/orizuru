# @financialforcedev/orizuru

## Latest changes (not yet released)

## 9.0.0-0 PREMAJOR

- The `addRoute` method can now add synchronous APIs.
	- Set the `synchronous` property to `true` in the route options to do this.
	- All incoming messages are still validated against the Apache Avro schema but are not published to a message queue.
	- The validated request is stored in the body property of the request.
	- Synchronous request logic should be added to the `responseWriter` property.
- The routing mechanism for Orizuru has been updated so that each endpoint now uses a different express router.
- Orizuru now expects a class for the transport layer.
	- Each server, publisher and handler should have a different transport instance.
	- The configuration for the transport can be provided in the constructor.
	- Updated ITransport interface.
	- Removed Orizuru.Transport.IConnect interface.
- Addition of helper methods for `listen`, `close`, `set` and `use` to the Orizuru `Server`.
	- By default, `close` also closes the transport layer.
	- By default, `listen` starts the server listening for connections specified in the `Options`.
- All Orizuru `Handler` and `Publisher` instances must now be initialised by calling the `init()` function. This initialises the connection.
- The `getPublisher` and `getServer` functions have been replaced with property getters.
- Added `Orizuru.Message` interface to the `IOrizuruMessage`.
	- This acts as the base interface for all messages sent by Orizuru.

- Events have now been converted to use symbols.
- Add system tests to test core functionality.
	- Addition of RabbitMQ docker image using the same version as Travis CI.
	- System test coverage is now included in Travis builds.
- Add nyc.opts file to clean up the package.json.

- Fix a regression where the context Avro schema could contain anonymous types.
- Documentation is now generated using the master branch for definition links.
