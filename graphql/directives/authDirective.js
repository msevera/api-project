const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const { defaultFieldResolver } = require('graphql');
const { rolesAccess } = require('../../security/roles');
const { ForbiddenError } = require('../errors');

const authDirective = () => {
  return {
    directiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.FIELD](fieldConfig) {
          const directive = getDirective(schema, fieldConfig, 'auth')?.[0];
          if (directive) {
            const { resolve = defaultFieldResolver } = fieldConfig;

            if (fieldConfig.resolve) {
              fieldConfig.resolve = async (source, args, context, info) => {
                const { authUser } = context;

                const userRoleIndex = rolesAccess.findIndex(
                  (r) => r === authUser?.role,
                );
                const requiredRoleIndex = rolesAccess.findIndex(
                  (r) => r === directive.role,
                );

                if (userRoleIndex < requiredRoleIndex) {
                  throw new ForbiddenError('Access denied');
                }

                return resolve(source, args, context, info);
              };
            }
            return fieldConfig;
          }
        },
      }),
  };
};

module.exports = authDirective;
