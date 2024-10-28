const { GraphQLError } = require('graphql');

class ApolloError extends GraphQLError {
  constructor(message, code) {
    super(message, {
      extensions: { code },
    });
  }
}

module.exports = ApolloError;
