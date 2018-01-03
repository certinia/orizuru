# @financialforcedev/orizuru

## Latest changes (not yet released)

### BREAKING CHANGES

- The server `addRoute` method has been updated to add each route separately.
- The server `addGet` method has been removed.
	- The `addRoute` allows you to specify the method as part of the route configuration.
- The `Server`, `Publisher` and `Handler` now extend `EventEmitter`.
	- Any cases of `Server.emitter`, `Publisher.emitter` and `Handler.emitter` should be changed to reference the instance.

### NEW FEATURES

- Added the `npm init-project` command.
	- This command should be called before running any of the examples. It makes a local copy of the `run.properties` and `test.properties` files.

### OTHER CHANGES

- The transport schema has been updated to an Apache Avro schema (`.avsc`) file.
- Updated the JS documentation to use the Minami theme.