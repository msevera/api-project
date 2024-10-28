exports.resolver = {
  Query: {
    getMe: async (parent, args, ctx) => {
      const userDomain = ctx.domains.User(ctx);
      return userDomain.getMe();
    },
    getUserById: async (parent, {id}, ctx) => {
      const userDomain = ctx.domains.User(ctx);
      return userDomain.getById({id});
    },
    getUserBySlug: async (parent, {slug}, ctx) => {
      const userDomain = ctx.domains.User(ctx);
      return userDomain.getBySlug({slug});
    },
  },
  Mutation: {
    signIn: async (parent, {email, password}, ctx) => {
      const userDomain = ctx.domains.User(ctx);
      return userDomain.signIn({email, password});
    },
    signUp: async (parent, {name, email, password, rePassword}, ctx) => {
      const userDomain = ctx.domains.User(ctx);
      return userDomain.signUp({name, email, password, rePassword});
    },
    blockUser: async (parent, {userId, blocked}, ctx) => {
      const userDomain = ctx.domains.User(ctx);
      return userDomain.blockUser({userId, blocked});
    },
    editUserProfileById: async (parent, {id, data}, ctx) => {
      const userDomain = ctx.domains.User(ctx);
      return userDomain.editProfileById({id, data});
    }
  },
};
