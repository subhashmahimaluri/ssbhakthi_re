import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';

// DateTime scalar
export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'A date-time string at UTC, such as 2007-12-03T10:15:30Z',
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
  },
  parseValue(value: unknown): Date {
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
      }
      return date;
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
    throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
  },
  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Value is not a valid DateTime: ${ast.value}`);
      }
      return date;
    }
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    throw new GraphQLError(
      `Can only parse strings and integers to DateTime but got a: ${ast.kind}`
    );
  },
});

// JSON scalar
export const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'A JSON scalar',
  serialize(value: unknown): any {
    return value;
  },
  parseValue(value: unknown): any {
    return value;
  },
  parseLiteral(ast): any {
    switch (ast.kind) {
      case Kind.STRING:
        try {
          return JSON.parse(ast.value);
        } catch {
          return ast.value;
        }
      case Kind.INT:
        return parseInt(ast.value, 10);
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.NULL:
        return null;
      case Kind.OBJECT:
        return ast.fields.reduce((acc, field) => {
          acc[field.name.value] = JSONScalar.parseLiteral(field.value);
          return acc;
        }, {} as any);
      case Kind.LIST:
        return ast.values.map(value => JSONScalar.parseLiteral(value));
      default:
        throw new GraphQLError(`Can only parse JSON-like values but got a: ${ast.kind}`);
    }
  },
});
