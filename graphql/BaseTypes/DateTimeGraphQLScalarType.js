const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

const DateTimeCustomScalarType = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime scalar type',
  serialize(value) {
    return new Date(value); // value from the client
  },
  parseValue(value) {
    return new Date(value); // value sent to the client
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return parseInt(ast.value, 10); // ast value is always in string format
    }

    if (ast.kind === Kind.STRING) {
      return new Date(ast.value); // ast value is always in string format
    }

    return null;
  },
});

module.exports = DateTimeCustomScalarType;
