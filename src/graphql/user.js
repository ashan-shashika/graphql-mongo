import { gql } from 'apollo-server-express';
import jwt from 'jsonwebtoken';

const typeDefs = gql`
  directive @authenticated on OBJECT | FIELD_DEFINITION
  type User {
    id: ID
    firstName: String
    lastName: String
    email: String
  }
  type LoggedUser {
    user: User
    token: String!
  }
  type Query {
    me: User
    users: [User] @authenticated
  }
  type Mutation {
    createUser(info: CreateUserInput): User
    login(info: UserLoginInputs): LoggedUser
    updateUser(info: UpdateUserInput): User @authenticated
    changePassword(info: ChangePasswordInput): LoggedUser @authenticated
  }
  input CreateUserInput {
    firstName: String!
    lastName: String
    email: String!
    password: String!
  }
  input UpdateUserInput {
    email: String
    firstName: String
    lastName: String
  }
  input UserLoginInputs {
    email: String!
    password: String!
  }
  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
    confirmPassword: String!
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
    updateUser: async (_, { info }, { model: { User }, currentUser }) => {
      // check new email exists
      if (info.email) {
        const isEmailExists = await User.findOne({ email: info.email });
        if (isEmailExists) throw new Error('Email already exists');
      }
      // update user
      try {
        const res = await User.updateOne({ _id: currentUser }, { ...info });
        // check updated DB record
        if (res.n) {
          return User.findOne({ _id: currentUser }).exec();
        }
        // eslint-disable-next-line no-throw-literal
        throw 'user not found';
      } catch (err) {
        throw new Error(err);
      }
    },
    login: async (_, { info }, { model: { User } }) => {
      const loginUser = await User.findOne({ email: info.email });
      if (!loginUser) throw new Error('Invalid email or password');
      const isValidPassword = await loginUser.comparePassword(info.password);
      if (!isValidPassword) throw new Error('Invalid email or password');
      // eslint-disable-next-line no-underscore-dangle
      const token = generatetoken(loginUser.email, loginUser._id);

      return { user: loginUser, token };
    },
    changePassword: async (_, { info }, { model: { User }, currentUser }) => {
      const loggedUser = await User.findOne({ _id: currentUser });
      if (!loggedUser) throw new Error('User not found');
      const isValidPassword = await loggedUser.comparePassword(info.currentPassword);
      if (!isValidPassword) throw new Error('Invalid password');
      if (info.newPassword !== info.confirmPassword) {
        throw new Error('New password and confirm password do not match');
      }
      // Update user password
      try {
        await User.updateOne({ _id: currentUser }, { password: info.newPassword });
      } catch (err) {
        throw new Error(err);
      }
      // eslint-disable-next-line no-underscore-dangle
      const token = generatetoken(loggedUser.email, loggedUser._id);
      return { user: loggedUser, token };
    },
  },
};

const generatetoken = (email, id) => {
  const token = jwt.sign({ email, id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  return token;
};
export default { typeDefs, resolvers };
