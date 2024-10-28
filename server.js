const express = require('express');
const { TokenExpiredError } = require('jsonwebtoken');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const helmet = require('helmet');
const cors = require('cors');
const graphqlSchema = require('./graphql');
const { verifyToken } = require('./utils/auth');
const { roles } = require('./security/roles');
const errorHandlerMiddleware = require('./express/errorHandlingMiddleware');
const { ApolloError } = require('./graphql/errors');
const { errorCodes } = require('./utils/errorUtils');
const { generateUsers } = require('./startup');
const { init } = require('./getInitFns');
const logger = require('./utils/logger');
const Transaction = require('./transaction');

const app = express();

module.exports.run = runServerFn => {
  init(
    async ({
             getDataSources,
             getServices,
             getSecurity,
             getDomains,
             store,
             cache,
             UserDataSource,
           }) => {
      const startTransaction = async () => {
        if (this?.transaction) {
          this.transaction.endSession();
        }

        const transaction = new Transaction();
        return transaction;
      };

      const createCtx = async ({ skipTransaction = false } = {}) => {
        const ctx = {
          dataSources: getDataSources(),
          domains: getDomains(),
          authUser: null,
          skipAuth: true,
          services: getServices(),
          security: getSecurity(),
          cache,
          startTransaction,
        };

        if (!skipTransaction) {
          ctx.transaction = await ctx.startTransaction();
        }

        return ctx;
      };

      const server = new ApolloServer({
        allowBatchedHttpRequests: true,
        persistedQueries: false,
        schema: graphqlSchema.executableSchema,
        uploads: false,
        formatError: err => {
          // Don't give the specific errors to the client.
          if (err.message.startsWith('Context creation failed: ')) {
            err.message = err.message.replace('Context creation failed: ', '');
          }
          // Otherwise return the original error. The error can also
          // be manipulated in other ways, as long as it's returned.
          return err;
        },
      });

      const run = async () => {
        let serverReady = false;
        await server.start();
        app.use(
          '/graphql',
          cors(),
          express.json(),
          expressMiddleware(server, {
            context: async ({ req }) => {
              let user = {
                role: roles.guest,
              };

              const token = (req.headers && req.headers.authorization) || '';
              if (token) {
                try {
                  user = verifyToken(token.split(' ')[1]);
                  if (user && user.id) {
                    const userDataSource = new UserDataSource({ store, cache });
                    const u = await userDataSource.getById(user.id);

                    if (u.blocked) {
                      throw new ApolloError('User is blocked', errorCodes.BLOCKED_USER);
                    }

                    if (u.tokenStamp !== user.tokenStamp) {
                      throw new ApolloError('Invalid Token', errorCodes.INVALID_TOKEN);
                    }

                    user = u;
                  }

                  // If token is incorrect treat user as a guest
                  // eslint-disable-next-line
                } catch (e) {
                  if (e instanceof TokenExpiredError) {
                    throw new ApolloError('Expired Token', errorCodes.EXPIRED_TOKEN);
                  } else if (e instanceof ApolloError) {
                    throw e;
                  } else {
                    user = {
                      role: [roles.guest],
                    };
                  }
                }
              }

              return {
                req,
                user,
                authUser: user,
                services: getServices(),
                security: getSecurity(),
                domains: getDomains(),
                dataSources: getDataSources(),
                startTransaction,
                cache,
              };
            },
          })
        );

        app.get('/health', (req, res) => {
          if (serverReady) {
            logger.info(`Server is ready for k8s pod to be started`);
            res.status(200).send({ status: 'Ready' });
          } else {
            logger.info(`Server is not ready yet for k8s pod to be started`);
            res.status(500).send({ status: 'Not ready' });
          }
        });

        app.use(helmet());
        app.use(errorHandlerMiddleware);

        await runServerFn(app);

        await generateUsers(createCtx)
        serverReady = true;
        console.log('Server is ready');
      };

      await run();
    }
  );
};
