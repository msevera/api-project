const { GraphQLError } = require('graphql');
const { errorCodes } = require('../../utils/errorUtils');

class ForbiddenError extends GraphQLError {
  constructor(message, reason) {
    super(message, {
      extensions: { code: errorCodes.FORBIDDEN, reason },
    });
  }
}

module.exports = ForbiddenError;
