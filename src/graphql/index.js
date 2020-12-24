import merge from 'lodash.merge';
import user from './user';

const typeDefs = [user.typeDefs];
const resolvers = merge({}, user.resolvers);

export default { typeDefs, resolvers };
