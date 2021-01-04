import merge from 'lodash.merge';
import user from './user';
import post from './post';

const typeDefs = [user.typeDefs, post.typeDefs];
const resolvers = merge({}, user.resolvers, post.resolvers);

export default { typeDefs, resolvers };
