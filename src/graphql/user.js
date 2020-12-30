import { gql } from 'apollo-server-express';
import jwt from 'jsonwebtoken';

const typeDefs = gql`
  type User {
    id: ID
    firstName: String
    lastName: String
    email: String
  }
  type Query {
    me: User
    users: [User]
  }
  type LoggedUser {
    user: User
    token: String!
  }
  type Mutation {
    createUser(info: CreateUserInput): User
    updateUser(info: UpdateUserInput): User
    login(info: UserLoginInputs): LoggedUser
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
  input UserLoginInputs {
    email: String!
    password: String!
  }
`;

const resolvers = {
  Query: {
    users: (_, __, { model: { User } }) => User.find(),
    me: async (_, __, { model: { User }, currentUser }) => {
      const user = await User.findOne({ _id: currentUser });
      return user;
    },
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
    login: async (_, { info }, { model: { User } }) => {
      const loginUser = await User.findOne({ email: info.email });
      if (!loginUser) throw new Error('Invalid email or password');
      const isValidPassword = await loginUser.comparePassword(info.password);
      if (!isValidPassword) throw new Error('invalid email or password');
      const token = jwt.sign(
        // eslint-disable-next-line no-underscore-dangle
        { email: loginUser.email, id: loginUser._id },
        process.env.JWT_SECRET,
        {
          expiresIn: '7d',
        },
      );
      return { user: loginUser, token };
    },
  },
};
export default { typeDefs, resolvers };
