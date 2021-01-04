import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type Post {
    title: String!
    description: String
    author: User
  }
  extend type Query {
    allPosts: [Post]
  }
  extend type Mutation {
    addPost(title: String!, description: String): Post @authenticated
  }
`;

const resolvers = {
  Post: {
    author: (post, __, { model: { User } }) => User.findOne({ _id: post.author }),
  },
  Query: {
    allPosts: (_, __, { model: { Post } }) => Post.find(),
  },
  Mutation: {
    addPost: async (_, { title, description }, { model: { Post }, currentUser }) => {
      const newPost = await new Post({ title, description, author: currentUser });
      newPost.save();
      return newPost;
    },
  },
};

export default { typeDefs, resolvers };
