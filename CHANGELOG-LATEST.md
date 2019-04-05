# @financialforcedev/orizuru

## Latest changes (not yet released)

### OTHER CHANGES

- Use the Docker image from Orizuru-Transport-RabbitMQ for the system tests
- Add Docker scripts to the package.json that:
  - Build the orizuru-transport-rabbitmq--rabbitmq service
  - Start the orizuru-transport-rabbitmq--rabbitmq service
  - Cleanup the created container and image
  - Start the service then run the system tests
- Remove the RabbitMQ service from the Travis configuration
- Amalgamate the change log files
