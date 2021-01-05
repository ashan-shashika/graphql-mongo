/* eslint-disable no-param-reassign */
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { defaultFieldResolver, DirectiveLocation, GraphQLDirective, GraphQLString } from 'graphql';
import { AuthenticationError, ForbiddenError } from 'apollo-server-express';

const HasPermissionDirectiveWrapped = Symbol('HasPermissionDirective wrapped');
const HasPermissionDirectiveMeta = Symbol('HasPermissionDirectiveMeta');

const createHasPermissionDirective = (model) =>
  class HasPermissionDirective extends SchemaDirectiveVisitor {
    static getDirectiveDeclaration(directiveName) {
      return new GraphQLDirective({
        name: directiveName,
        locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD_DEFINITION],
        args: {
          permission: {
            type: GraphQLString,
          },
        },
      });
    }

    visitObject(type) {
      this.ensureFieldsWrapped(type);
      type[HasPermissionDirectiveMeta] = { permission: this.args.permission };
    }

    visitFieldDefinition(field, details) {
      this.ensureFieldsWrapped(details.objectType);
      field[HasPermissionDirectiveMeta] = { permission: this.args.permission };
    }

    ensureFieldsWrapped(objectType) {
      if (objectType[HasPermissionDirectiveWrapped]) {
        return;
      }

      objectType[HasPermissionDirectiveWrapped] = true;

      const fields = objectType.getFields();

      Object.values(fields).forEach((field) => {
        const { resolve = defaultFieldResolver } = field;

        field.resolve = async function resolveFun(...args) {
          const meta = field[HasPermissionDirectiveMeta] || objectType[HasPermissionDirectiveMeta];

          if (!meta) {
            return resolve.apply(this, args);
          }

          const context = args[2];
          if (!context.currentUser) {
            throw new AuthenticationError('Not authenticated');
          }

          const { permission } = meta;
          // get user role
          const userRole = await model.User.findOne({ _id: context.currentUser }, 'roles');

          // get user permissions
          let userPermissions = await model.Role.find({ _id: userRole.id });
          userPermissions = userPermissions.map((perm) => perm.name);

          // check user has permission
          const hasPermission = userPermissions.includes((perm) => perm.name === permission);

          if (!hasPermission) {
            throw new ForbiddenError('Not authorized to access this resource');
          }

          return resolve.apply(this, args);
        };
      });
    }
  };

export default createHasPermissionDirective;
