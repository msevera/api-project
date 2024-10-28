const generateUsers = async createCtx => {
  const ctx = await createCtx();
  try {
    const userDomain = ctx.domains.User(ctx);
    const users = [
      {
        name: 'Admin',
        email: 'admin@project.com',
        password: '111111',
        rePassword: '111111',
        role: ctx.security.roles.admin
      }
    ];

    for (const user of users) {
      try {
        await userDomain.getByEmail({ email: user.email });
        // eslint-disable-next-line
      } catch {
        await userDomain.createUser({
          name: user.name,
          email: user.email,
          password: user.password,
          rePassword: user.rePassword,
          role: user.role
        });
      }
    }
  } finally {
    await ctx.transaction.endSession();
  }
};

module.exports = {
  generateUsers,
};
