import merge from 'lodash.merge';
import user from './user';
import post from './post';
import permissonAndRole from './permissonAndRole';

const typeDefs = [user.typeDefs, post.typeDefs, permissonAndRole.typeDefs];
const resolvers = merge({}, user.resolvers, post.resolvers, permissonAndRole.resolvers);

export default { typeDefs, resolvers };
