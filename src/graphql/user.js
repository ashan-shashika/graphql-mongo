import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type User {
    id: ID
    firstName: String
    lastName: String
    email: String
  }
  type Query {
    users: [User]
  }
  type Mutation {
    createUser(info: CreateUserInput): User
    updateUser(info: UpdateUserInput): User
  }
  input CreateUserInput {
    firstName: String!
    lastName: String
    email: String!
    password: String!
  }
  input UpdateUserInput {
    email: String!
    firstName: String
    lastName: String
  }
`;

const resolvers = {
  Query: {
    users: (_, __, { model: { User } }) => User.find(),
  },
  Mutation: {
    createUser: async (_, { info }, { model: { User } }) => {
      const isUserExists = await User.findOne({ email: info.email });
      if (isUserExists) {
        throw new Error('Email already exists');
      }
      try {
        const newUser = await User.create(info);
        return newUser;
      } catch (err) {
        throw new Error(err);
      }
    },
    updateUser: async (_, { info }, { model: { User } }) => {
      try {
        const res = await User.updateOne({ email: info.email }, { ...info });
        if (res.n) {
          return User.findOne({ email: info.email }).exec();
        }
        throw new Error(`user not found`);
      } catch (err) {
        throw new Error(err);
      }
    },
  },
};
export default { typeDefs, resolvers };
