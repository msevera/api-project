const httpErrors = require('http-errors');

class ServerError extends httpErrors.NotFound {
  constructor(message, errorCode) {
    super(message);
    this.errorCode = errorCode;
  }
}

module.exports = ServerError;
