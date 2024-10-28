const { GraphQLError } = require('graphql');
const { ApolloServerErrorCode } = require('@apollo/server/errors');

class BadRequestError extends GraphQLError {
  constructor(message, reason) {
    super(message, {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST, reason },
    });
  }
}

module.exports = BadRequestError;
