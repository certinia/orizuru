# @financialforcedev/orizuru

## 8.0.2

### FIXES

- Default the event name to the schema name when publishing a message.

## 8.0.1

### FIXES

- Make sure that messages can be published if the context is empty.

## 8.0.0

### BREAKING CHANGES
 
- Use generic types for the IOrizuruMessage.
	- This will cause compile time errors even though there are no functional changes.

### NEW FEATURES 

- Add use and set functions to the server.
- Export static function from express in the index.
