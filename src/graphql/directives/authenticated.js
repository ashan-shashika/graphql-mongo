/* eslint-disable no-param-reassign */
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { defaultFieldResolver, DirectiveLocation, GraphQLDirective } from 'graphql';
import { AuthenticationError } from 'apollo-server-express';

const AuthenticatedDirectiveWrapped = Symbol('AuthenticatedDirective wrapped');
const Authenticated = Symbol('Authenticated');

export default class AuthenticatedDirective extends SchemaDirectiveVisitor {
  static getDirectiveDeclaration(directiveName) {
    return new GraphQLDirective({
      name: directiveName,
      locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD_DEFINITION],
    });
  }

  visitObject(type) {
    this.ensureFieldsWrapped(type);
    type[Authenticated] = true;
  }

  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType);
    field[Authenticated] = true;
  }

  ensureFieldsWrapped(objectType) {
    if (objectType[AuthenticatedDirectiveWrapped]) {
      return;
    }

    objectType[AuthenticatedDirectiveWrapped] = true;

    const fields = objectType.getFields();

    Object.values(fields).forEach((field) => {
      const { resolve = defaultFieldResolver } = field;

      field.resolve = async function resolveFun(...args) {
        const requiresAuthentication = field[Authenticated] || objectType[Authenticated];

        if (!requiresAuthentication) {
          return resolve.apply(this, args);
        }

        const context = args[2];
        if (!context.currentAccountId) {
          throw new AuthenticationError('Not authenticated');
        }

        return resolve.apply(this, args);
      };
    });
  }
}
