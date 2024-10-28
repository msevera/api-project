const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const { defaultFieldResolver } = require('graphql');
const { verifyClientSignature } = require('../../utils/auth');

const authClientDirective = directiveName => {
  return {
    directiveTypeDefs: `directive @${directiveName} on FIELD_DEFINITION`,
    directiveTransformer: schema =>
      mapSchema(schema, {
        [MapperKind.FIELD](fieldConfig) {
          const deprecatedDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
          if (deprecatedDirective) {
            const { resolve = defaultFieldResolver } = fieldConfig;

            if (fieldConfig.resolve) {
              fieldConfig.resolve = async (source, args, context, info) => {
                const { req } = context;
                const signature = (req.headers && req.headers['x-api-signature']) || '';
                verifyClientSignature(signature, args?.data || {});
                return resolve(source, args, context, info);
              };
            }
            return fieldConfig;
          }
        },
      }),
  };
};

module.exports = authClientDirective;
