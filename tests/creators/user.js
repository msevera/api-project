module.exports = {
  getUser: async ({ ctx, createCtx, authUser }, { userId }) => {
    const { domains } = ctx;
    return domains.User(await createCtx(authUser)).getById({ id: userId });
  },
  getUsers: async ({ ctx, createCtx, authUser }, { userIds }) => {
    const { domains } = ctx;

    const users = [];
    for (const userId of userIds) {
      const user = await domains
        .User(await createCtx(authUser))
        .getById({ id: userId });
      users.push(user);
    }

    return users;
  },
};
