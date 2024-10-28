const mongoose = require('mongoose');
const logger = require('./utils/logger');

const TxnState = Object.freeze({
  NO_TRANSACTION: 'NO_TRANSACTION',
  STARTING_TRANSACTION: 'STARTING_TRANSACTION',
  TRANSACTION_IN_PROGRESS: 'TRANSACTION_IN_PROGRESS',
  TRANSACTION_COMMITTED: 'TRANSACTION_COMMITTED',
  TRANSACTION_COMMITTED_EMPTY: 'TRANSACTION_COMMITTED_EMPTY',
  TRANSACTION_ABORTED: 'TRANSACTION_ABORTED',
});

const MONGODB_ERROR_CODES = Object.freeze({
  MaxTimeMSExpired: 50,
});

const USER_EXPLICIT_TXN_END_STATES = new Set([
  TxnState.NO_TRANSACTION,
  TxnState.TRANSACTION_COMMITTED,
  TxnState.TRANSACTION_ABORTED,
]);

const MAX_WITH_TRANSACTION_TIMEOUT = 10000;

class Transaction {
  constructor() {
    this._session = null;
    this._started = false;
    this._initialFn = null;
  }

  async startSession() {
    if (!this._session) {
      this._session = await mongoose.startSession();
    }
  }

  async endSession() {
    if (this._session) {
      await this._session.endSession();
    }
  }

  get session() {
    return this._session;
  }

  get started() {
    return this._started;
  }

  isPromiseLike(maybePromise) {
    return !!maybePromise && typeof maybePromise.then === 'function';
  }

  now() {
    const hrtime = process.hrtime();
    return Math.floor(hrtime[0] * 1000 + hrtime[1] / 1000000);
  }

  calculateDurationInMs(started) {
    if (typeof started !== 'number') {
      throw new Error('Numeric value required to calculate duration');
    }

    const elapsed = this.now() - started;
    return elapsed < 0 ? 0 : elapsed;
  }

  hasNotTimedOut(startTime, max) {
    return this.calculateDurationInMs(startTime) < max;
  }

  userExplicitlyEndedTransaction(session) {
    return USER_EXPLICIT_TXN_END_STATES.has(session.transaction.state);
  }

  isMaxTimeMSExpiredError(err) {
    if (err == null || !(err.name === 'MongoServerError')) {
      return false;
    }

    return (
      err.code === MONGODB_ERROR_CODES.MaxTimeMSExpired ||
      (err.writeConcernError && err.writeConcernError.code === MONGODB_ERROR_CODES.MaxTimeMSExpired)
    );
  }

  attemptTransactionCommit(session, fn) {
    return session.commitTransaction().catch(err => {
      if (
        (err.name === 'MongoServerError' || err.name === 'MongoError' || err.name === 'MongoBulkWriteError') &&
        this.hasNotTimedOut(this._startTime, MAX_WITH_TRANSACTION_TIMEOUT) &&
        !this.isMaxTimeMSExpiredError(err)
      ) {
        if (err.hasErrorLabel('UnknownTransactionCommitResult')) {
          return this.attemptTransactionCommit(session, fn);
        }

        if (err.hasErrorLabel('TransientTransactionError')) {
          return this.withTransaction(true, fn);
        }
      }

      throw err;
    });
  }

  async withTransaction(newTransaction, fn) {
    if (newTransaction && !this._started) {
      await this.startSession();
      this._started = true;
      this._session.startTransaction();
      this._initialFn = fn;
      if (!this._startTime) {
        this._startTime = this.now();
      }
    } else {
      return fn();
    }

    let promise;
    try {
      promise = fn();
    } catch (err) {
      promise = Promise.reject(err);
    }

    if (!this.isPromiseLike(promise)) {
      this._session.abortTransaction();
      throw new Error('Function provided to `withTransaction` must return a Promise');
    }

    return promise.then(
      () => {
        if (this.userExplicitlyEndedTransaction(this._session)) {
          return;
        }

        return this.attemptTransactionCommit(this._session, this._initialFn);
      },
      err => {
        // eslint-disable-next-line
        const maybeRetryOrThrow = err => {
          if (
            (err.name === 'MongoServerError' || err.name === 'MongoError' || err.name === 'MongoBulkWriteError') &&
            err?.hasErrorLabel('TransientTransactionError') &&
            this.hasNotTimedOut(this._startTime, MAX_WITH_TRANSACTION_TIMEOUT)
          ) {
            logger.info('MongoDb Transaction retry');
            return this.withTransaction(true, this._initialFn);
          }

          if (this.isMaxTimeMSExpiredError(err)) {
            err.addErrorLabel('UnknownTransactionCommitResult');
          }

          throw err;
        };

        if (this._session.transaction.isActive) {
          return this._session.abortTransaction().then(() => maybeRetryOrThrow(err));
        }

        return maybeRetryOrThrow(err);
      }
    );
  }
}

module.exports = Transaction;
