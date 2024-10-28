function getErrorMessage(error) {
  /**
   * If it exists, prefer the error stack as it usually
   * contains the most detail about an error:
   * an error message and a function call stack.
   */

  const errorObject = {};

  if (error.stack) {
    errorObject.stack = error.stack;
  }

  if (error.message) {
    errorObject.message = error.message;
  }

  if (error.errorCode) {
    errorObject.errorCode = error.errorCode;
  }

  return error;
}

/**
 * Log an error message to stderr.
 *
 * @see https://nodejs.org/dist/latest-v14.x/docs/api/console.html#console_console_error_data_args
 *
 * @param {string} error
 */
function logErrorMessage(error) {
  console.error(error);
}

/**
 * Determines if an HTTP status code falls in the 4xx or 5xx error ranges.
 *
 * @param {number} statusCode - HTTP status code
 * @return {boolean}
 */
function isErrorStatusCode(statusCode) {
  return statusCode >= 400 && statusCode < 600;
}

/**
 * Look for an error HTTP status code (in order of preference):
 *
 * - Error object (`status` or `statusCode`)
 * - Express response object (`statusCode`)
 *
 * Falls back to a 500 (Internal Server Error) HTTP status code.
 *
 * @param {Object} options
 * @param {Error} options.error
 * @param {Object} options.response - Express response object
 * @return {number} - HTTP status code
 */
function getHttpStatusCode({ error, response }) {
  /**
   * Check if the error object specifies an HTTP
   * status code which we can use.
   */
  const statusCodeFromError = error.status || error.statusCode;
  if (isErrorStatusCode(statusCodeFromError)) {
    return statusCodeFromError;
  }

  /**
   * The existing response `statusCode`. This is 200 (OK)
   * by default in Express, but a route handler or
   * middleware might already have set an error HTTP
   * status code (4xx or 5xx).
   */
  const statusCodeFromResponse = response.statusCode;
  if (isErrorStatusCode(statusCodeFromResponse)) {
    return statusCodeFromResponse;
  }

  /**
   * Fall back to a generic error HTTP status code.
   * 500 (Internal Server Error).
   *
   * @see https://httpstatuses.com/500
   */
  return 500;
}

function errorHandlerMiddleware(error, request, response, next) {
  const errorMessage = getErrorMessage(error);

  logErrorMessage(errorMessage);

  /**
   * If response headers have already been sent,
   * delegate to the default Express error handler.
   */
  if (response.headersSent) {
    return next(error);
  }

  const errorResponse = {
    statusCode: getHttpStatusCode({ error, response }),
    body: undefined,
  };

  /**
   * Set the response status code.
   */
  response.status(errorResponse.statusCode);

  /**
   * Send an appropriately formatted response.
   *
   * The Express `res.format()` method automatically
   * sets `Content-Type` and `Vary: Accept` response headers.
   *
   * @see https://expressjs.com/en/api.html#res.format
   *
   * This method performs content negotation.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation
   */
  response.format({
    //
    // Callback to run when `Accept` header contains either
    // `application/json` or `*/*`, or if it isn't set at all.
    //
    'application/json': () => {
      /**
       * Set a JSON formatted response body.
       * Response header: `Content-Type: `application/json`
       */

      const { message, stack, errorCode } = errorMessage;
      response.json({ message, stack, errorCode });
    },
    /**
     * Callback to run when none of the others are matched.
     */
    default: () => {
      /**
       * Set a plain text response body.
       * Response header: `Content-Type: text/plain`
       */
      response.type('text/plain').send(errorResponse.body);
    },
  });

  /**
   * Ensure any remaining middleware are run.
   */
  next();
}

module.exports = errorHandlerMiddleware;
