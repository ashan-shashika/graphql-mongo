import 'dotenv/config';
import express from 'express';
import { ApolloServer, makeExecutableSchema } from 'apollo-server-express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { applyMiddleware } from 'graphql-middleware';
import schema from './graphql';
import model from './models';
import AuthenticatedDirective from './graphql/directives/authenticated';
import middleware from './middleware';

const getCurrentUserId = async ({ headers }) => {
  const matcher = /^Bearer .+$/gi;
  const { authorization = null } = headers;

  if (authorization && matcher.test(authorization)) {
    const [, token] = authorization.split(/\s+/);

    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.id;
      }
    } catch (e) {
      // We do nothing so it returns null
    }
  }

  return null;
};

const graphqlSchema = makeExecutableSchema({
  typeDefs: schema.typeDefs,
  resolvers: schema.resolvers,
});
const schemaWithMiddleware = applyMiddleware(graphqlSchema, middleware);

const startServer = async () => {
  const server = new ApolloServer({
    schema: schemaWithMiddleware,
    schemaDirectives: {
      authenticated: AuthenticatedDirective,
    },
    context: async ({ req }) => {
      const currentUser = await getCurrentUserId(req);
      return { model, currentUser };
    },
  });

  const app = express();
  server.applyMiddleware({ app });

  // DB connection
  await mongoose.connect('mongodb://localhost:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
  // mongoose.set('debug', true);

  app.listen({ port: 4000 }, () =>
    // eslint-disable-next-line no-console
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`),
  );
};

startServer();
