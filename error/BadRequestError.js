const httpErrors = require('http-errors');

class NotFoundError extends httpErrors.BadRequest {
  constructor(message, errorCode) {
    super(message);
    this.errorCode = errorCode;
  }
}

module.exports = NotFoundError;
