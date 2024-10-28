const httpErrors = require('http-errors');

class NotFoundError extends httpErrors.NotFound {
  constructor(message, errorCode) {
    super(message);
    this.errorCode = errorCode;
  }
}

module.exports = NotFoundError;
