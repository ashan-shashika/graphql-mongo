import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type Role {
    id: ID
    name: String!
    description: String
    permissions: [Permisson]
  }
  type Permisson {
    id: ID
    name: String!
    description: String
  }
  extend type Query {
    userRoles: [Role]
    allPermissions: [Permisson] @authenticated
  }
  enum UserRole {
    superAdmin
    admin
    user
  }
  extend type Mutation {
    addRole(name: String!, description: String): Role @authenticated
    addPermission(name: String!, description: String): Permisson @authenticated
    addRolePermissions(role: UserRole, permissionIds: [String!]!): String @authenticated
    removeRolePermissions(role: UserRole, permissionId: String!): String @authenticated
  }
`;

const resolvers = {
  Role: {
    permissions: (role, __, { model: { Permission } }) =>
      Permission.find({ _id: role.permissions }),
  },
  Query: {
    userRoles: (_, __, { model: { Role } }) => Role.find(),
    allPermissions: (_, __, { model: { Permission } }) => Permission.find(),
  },
  Mutation: {
    addRole: async (_, { name, description }, { model: { Role } }) => {
      const newRole = await new Role({ name, description, permissions: [] });
      newRole.save();
      return newRole;
    },
    addPermission: async (_, { name, description }, { model: { Permission } }) => {
      const newPermission = await new Permission({ name, description });
      newPermission.save();
      return newPermission;
    },
    addRolePermissions: async (_, { role, permissionIds }, { model: { Role, Permission } }) => {
      try {
        // validate permission ids
        let allPermissions = await Permission.find({}, 'id');
        allPermissions = allPermissions.map((per) => per.id.toString());
        const isValidIds = permissionIds.every((id) => allPermissions.includes(id));
        if (!isValidIds) {
          throw new Error('Invalid permission found');
        }
        const isUpdate = await Role.updateOne({ name: role }, { permissions: permissionIds });
        // eslint-disable-next-line no-throw-literal
        if (!isUpdate.n) throw 'User role not found';
        return 'Updated role permissions';
      } catch (error) {
        throw new Error(error);
      }
    },
    removeRolePermissions: async (_, { role, permissionId }, { model: { Role, Permission } }) => {
      // validate permisson id
      let allPermissions = await Permission.find({}, 'id');
      allPermissions = allPermissions.map((per) => per.id.toString());

      const isValidId = allPermissions.includes(permissionId);
      if (!isValidId) throw new Error('Invalid permission found');
      // get role permissions
      const currentRole = await Role.findOne({ name: role }).exec();
      const newPermissions = currentRole.permissions.filter((id) => id.toString() !== permissionId);
      try {
        const isUpdate = await Role.updateOne({ name: role }, { permissions: newPermissions });
        // eslint-disable-next-line no-throw-literal
        if (!isUpdate.n) throw 'Role permission not updated';
        return 'removed role permissions';
      } catch (error) {
        throw new Error(error);
      }
    },
  },
};

export default { typeDefs, resolvers };
