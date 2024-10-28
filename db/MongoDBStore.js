const mongoose = require('mongoose');
const shutdown = require('../utils/shutdown');
const logger = require('../utils/logger');

class MongoDBStore {
  constructor({ models, connectionUrl }) {
    this.models = models;
    this.connectionUrl = connectionUrl;
  }

  async connect() {
    try {
      logger.info('Connecting to database...');
      await mongoose.connect(this.connectionUrl);
      logger.info('Database connected...');
      mongoose.connection.on('error ', err => {
        logger.error('Mongoose initial connection error', err);
      });

      shutdown('Mongoose', () => mongoose.disconnect());
    } catch (err) {
      logger.error('Mongoose post connection error: ', err);
    }
  }

  getModels() {
    return this.models;
  }
}

module.exports = MongoDBStore;
