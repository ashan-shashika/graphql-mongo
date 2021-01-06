import { gql } from 'apollo-server-express';
import { v4 } from 'uuid';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail';
import upload from '../utils/upload';
import generatetoken from '../utils/auth';

const typeDefs = gql`
  directive @authenticated on OBJECT | FIELD_DEFINITION
  type User {
    id: ID
    firstName: String
    lastName: String
    email: String
    posts: [Post] @authenticated
  }
  type LoggedUser {
    user: User
    token: String!
  }
  type Query {
    me: User
    users: [User] @authenticated
  }
  type Token {
    token: String
  }
  type Mutation {
    createUser(info: CreateUserInput): User
    login(info: UserLoginInputs): LoggedUser
    updateUser(info: UpdateUserInput): User @authenticated
    changePassword(info: ChangePasswordInput): LoggedUser @authenticated
    forgetPassword(email: String!): Boolean
    resetPassword(token: String!, password: String!): String
    refreshToken: Token
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
    profileImage: Upload
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
  User: {
    posts: (user, _, { model: { Post } }) => Post.find({ author: user.id }),
  },
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
      const userInfo = { ...info };
      // check new email exists
      if (info.email) {
        const isEmailExists = await User.findOne({ email: info.email });
        if (isEmailExists) throw new Error('Email already exists');
      }
      // upload Image
      if (info.profileImage) {
        const imagePath = await upload(info.profileImage);
        if (imagePath) {
          userInfo.profileImage = imagePath;
        }
      }
      // update user
      try {
        const res = await User.updateOne({ _id: currentUser }, { ...userInfo });
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
    login: async (_, { info }, { res, model: { User } }) => {
      const loginUser = await User.findOne({ email: info.email });
      // user not found in DB
      if (!loginUser) throw new Error('Invalid email or password');
      const isValidPassword = await loginUser.comparePassword(info.password);
      // password not matched
      if (!isValidPassword) throw new Error('Invalid email or password');
      // create tokens
      const { accessToken, refreshToken } = generatetoken(loginUser);
      // save refreshtoken in cookie
      res.cookie('refresh-token', refreshToken);
      return { user: loginUser, token: accessToken };
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
    forgetPassword: async (_, { email }, { model: { User } }) => {
      const user = await User.findOne({ email });
      if (!user) {
        // the email is not in the db
        return false;
      }
      const token = v4();
      // add token to db
      await User.updateOne({ _id: user.id }, { resetPasswordToken: token });
      // send email
      const html = `<a href="http://localhost:3000/reset-password/${token}">reset password</a>`;
      await sendEmail({ to: user.email, subject: 'Reset password', html });
      return true;
    },
    resetPassword: async (_, { token, password }, { model: { User } }) => {
      const user = await User.findOne({ resetPasswordToken: token });
      if (!user) throw new Error('user no longer exists');
      await User.updateOne({ _id: user.id }, { password });
      return 'password successfully updated ';
    },
    refreshToken: async (_, __, { req, res, model }) => {
      const oldToken = req.cookies['refresh-token'];
      let data;
      try {
        data = jwt.verify(oldToken, process.env.REFRESH_TOKEN_SECRET);
      } catch (err) {
        return { token: '' };
      }
      const user = await model.User.findOne({ _id: data.userId });
      // token has been invalidated
      if (!user) {
        return { token: '' };
      }
      // create tokens
      const { accessToken, refreshToken } = generatetoken(user);
      // save refreshtoken in cookie
      res.cookie('refresh-token', refreshToken, { maxAge: 60 * 60 * 24 * 14 });
      return { token: accessToken };
    },
  },
};
export default { typeDefs, resolvers };
