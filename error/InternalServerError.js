const httpErrors = require('http-errors');

class InternalServerError extends httpErrors.InternalServerError {
  constructor(message, errorCode) {
    super(message);
    this.errorCode = errorCode;
  }
}

module.exports = InternalServerError;
