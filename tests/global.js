require('dotenv').config({ path: './.env.test' });
require('./mocks');
const mongoose = require('mongoose');
const { init } = require('../getInitFns');
const Transaction = require('../transaction');
const { generateUsers } = require('./generation/users');

const _defaults = {
  users: [],
  ctx: undefined,
};

const delay = (milliseconds = 1000) => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      resolve();
    }, milliseconds);
  });
};

let createCtx;
let _redisClient;

beforeAll(async () => {
  await init(
    async ({
      getDataSources,
      getServices,
      getSecurity,
      getDomains,
      redisClient,
    }) => {
      _redisClient = redisClient;
      const startTransaction = async () => {
        if (this?.transaction) {
          this.transaction.endSession();
        }

        const transaction = new Transaction();
        return transaction;
      };

      createCtx = async ({ skipTransaction = false } = {}) => {
        const ctx = {
          dataSources: getDataSources(),
          domains: getDomains(),
          services: getServices(),
          security: getSecurity(),
          startTransaction,
        };

        if (!skipTransaction) {
          ctx.transaction = await ctx.startTransaction();
        }

        return ctx;
      };
    },
  );
});

beforeEach(async () => {
  _defaults.users = {};
  const ctx = await createCtx();
  const {
    userA,
    userB,
    userC,
    userD,

  } = await generateUsers(ctx);
  _defaults.users = {
    userA,
    userB,
    userC,
    userD,
  };
  _defaults.ctx = {
    ...ctx,
    authUser: userA,
  };

  _defaults.createCtx = async (authUser, skipTransaction) => {
    const ctx_ = await createCtx({ skipTransaction });

    if (ctx_?.services?.board) {
      await ctx_.services.board.init(createCtx);
    }

    return {
      ...ctx_,
      authUser,
    };
  };
});

async function removeAllDataFromAllModels() {
  // eslint-disable-next-line
  for (const modelName in mongoose.models) {
    const model = mongoose.models[modelName];
    await model.deleteMany({}); // This removes all documents from the model's collection
  }
}

afterEach(async () => {
  await _defaults.ctx.transaction.endSession();
  await removeAllDataFromAllModels();
  await _redisClient.flushAll();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await _redisClient.quit();
});

module.exports = {
  _defaults,
  delay,
};
