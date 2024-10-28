const { GraphQLError } = require('graphql');
const { errorCodes } = require('../../utils/errorUtils');

class NotFoundError extends GraphQLError {
  constructor(message, reason) {
    super(message, {
      extensions: { code: errorCodes.NOT_FOUND, reason },
    });
  }
}

module.exports = NotFoundError;
