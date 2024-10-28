const { mapSchema, MapperKind } = require('@graphql-tools/utils');
const { defaultFieldResolver } = require('graphql');
const Transaction = require('../../transaction');

const transactionMiddlewareDirective = () => {
  return {
    directiveTransformer: schema =>
      mapSchema(schema, {
        [MapperKind.ROOT_FIELD](fieldConfig) {
          const { resolve = defaultFieldResolver } = fieldConfig;
          if (fieldConfig.resolve) {
            fieldConfig.resolve = async (source, args, context, info) => {
              if (info.operation.operation === 'mutation') {
                const transaction = new Transaction();
                context.transaction = transaction;
              }
              return resolve(source, args, context, info);
            };
          }
          return fieldConfig;
        },
      }),
  };
};

module.exports = transactionMiddlewareDirective;
