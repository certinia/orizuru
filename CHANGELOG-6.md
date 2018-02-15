# @financialforcedev/orizuru

## 6.1.0

### NEW FEATURES

- Allow customisation of the mapping from Avro schema namespace to URL path.

## 6.0.1

### FIXES

- Make the subscribe handler wrapper async, and await the inner handler.

## 6.0.0

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
- Removed the jsbeautifyrc file.
	- We now use the beautify file specified in the eslint-config package.
	