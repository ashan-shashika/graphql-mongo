const isAuthenticated = async (resolve, parent, args, context, info) => {
  if (!context.currentUser) {
    // user is not logged in
    throw new Error('not authenticated from graphql middleware');
  }

  return resolve(parent, args, context, info);
};

const hasPermission = (permission) => async (resolve, parent, args, context, info) => {
  if (!context.currentUser) {
    // user is not logged in
    throw new Error('not authenticated from graphql middleware');
  }
  //   get user role
  const userRole = await await context.model.User.findOne({ _id: context.currentUser });
  //   get all permissions
  let allPermissions = await context.model.Role.findOne({ _id: userRole.role }, 'permissions');
  allPermissions = allPermissions.permissions.map((id) => id);
  // check user has permission
  const reqPermission = await context.model.Permission.findOne({ name: permission }, 'id');
  const isValid = allPermissions.includes(reqPermission.id);
  if (!isValid) throw new Error('Not authorized to access this resource');

  return resolve(parent, args, context, info);
};

export default {
  Query: {
    users: hasPermission('read:any_user'),
    me: isAuthenticated,
  },
};
