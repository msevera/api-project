const { makeExecutableSchema } = require('@graphql-tools/schema');
const Glue = require('schemaglue');
const authDirective = require('./directives/authDirective');
const authClientDirective = require('./directives/authClientDirective');
const postMiddlewareDirective = require('./directives/postMiddlewareDirective');
const transactionMiddlewareDirective = require('./directives/transactionMiddlewareDirective');

const options = {
  js: '**/*.js', // default
  ignore: ['index.js', './directives/*.js', './errors/*.js'],
};

const { schema, resolver } = Glue('graphql/', options);

const { directiveTypeDefs: analyticsDirectiveTypeDefs, directiveTransformer: analyticsDirectiveTransformer } =
  authClientDirective('authClient');

const { directiveTypeDefs: authDirectiveTypeDefs, directiveTransformer: authDirectiveTransformer } =
  authDirective('auth(role: Role)');

const { directiveTransformer: transactionMiddlewareDirectiveTransformer } = transactionMiddlewareDirective();
const { directiveTransformer: postMiddlewareDirectiveTransformer } = postMiddlewareDirective();

let executableSchema = makeExecutableSchema({
  typeDefs: [schema, analyticsDirectiveTypeDefs, authDirectiveTypeDefs],
  resolvers: resolver,
  resolverValidationOptions: {
    requireResolversForResolveType: false,
  },
});

executableSchema = authDirectiveTransformer(executableSchema);
executableSchema = analyticsDirectiveTransformer(executableSchema);
executableSchema = postMiddlewareDirectiveTransformer(executableSchema);
executableSchema = transactionMiddlewareDirectiveTransformer(executableSchema);

module.exports = { executableSchema, typeDefs: schema, resolvers: resolver };
