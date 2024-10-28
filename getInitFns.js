require('dotenv').config();
const redis = require('redis');
const logger = require('./utils/logger');
const { MongoDBStore } = require('./db');
const DomainFactory = require('./domains/base/domainFactory');
const ProductDomain = require('./domains/product');
const UserDomain = require('./domains/user');
const ProductDataSource = require('./datasources/product');
const UserDataSource = require('./datasources/user');
const { RBACAuthorization, access } = require('./security/security');
const { roles } = require('./security/roles');
const UserCache = require('./cache/user');
const ProductCache = require('./cache/product');

const productModel = require('./models/Product');
const userModel = require('./models/User');

const initMongoDB = async () => {
  const store = new MongoDBStore({
    models: {
      Product: productModel,
      User: userModel,
     },
    connectionUrl: process.env.DB,
  });
  await store.connect();
  return store;
};

const initRedisClient = async () => {
  const redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      reconnectStrategy: () => 1000,
    },
    database: process.env.REDIS_DB,
  });

  redisClient.on('error', err => {
    logger.error('Redis Client Error', err);
  });

  redisClient.connect();

  return redisClient;
};

const init = async (cb) => {
  const store = await initMongoDB();
  const redisClient = await initRedisClient();
  const cache = {
    Product: new ProductCache(redisClient),
    User: new UserCache(redisClient),
    };

  const authorization = new RBACAuthorization();

  const getDataSources = () => ({
    Product: new ProductDataSource({ store, cache }),
    User: new UserDataSource({ store, cache }),

  });

  const getServices = () => ({

  });

  const getSecurity = () => ({
    authorization,
    roles,
    access,
  });

  const domainFactory = new DomainFactory({
    domains: {
      Product: ProductDomain,
      User: UserDomain,
    },
  });

  domainFactory.init();

  const getDomains = () => domainFactory.getDomains();

  await cb({
    getDataSources,
    getServices,
    getSecurity,
    getDomains,
    store,
    cache,
    UserDataSource,
    redisClient
  });
};

module.exports = {
  init,
};
