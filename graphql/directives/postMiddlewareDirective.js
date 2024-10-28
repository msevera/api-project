const { mapSchema, MapperKind } = require('@graphql-tools/utils');
const { defaultFieldResolver } = require('graphql');

const postMiddlewareDirective = () => {
  return {
    directiveTransformer: schema =>
      mapSchema(schema, {
        [MapperKind.ROOT_FIELD](fieldConfig) {
          const { resolve = defaultFieldResolver } = fieldConfig;
          if (fieldConfig.resolve) {
            fieldConfig.resolve = async (source, args, context, info) => {
              let result;
              try {
                result = await resolve(source, args, context, info);
              } finally {
                await context?.transaction?.endSession();
              }
              return result;
            };
          }
          return fieldConfig;
        },
      }),
  };
};

module.exports = postMiddlewareDirective;
