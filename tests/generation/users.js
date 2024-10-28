module.exports = {
  generateUsers: async (ctx) => {
    const {dataSources} = ctx;
    const userA = await dataSources.User.create({
      slug: 'user-a',
      name: 'User A',
      email: 'usera@project.com',
      bio: 'User A bio',
      tokenStamp: 'tokenStamp',
      role: 'CONSUMER',
      hash: '1234'
    });

    const userB = await dataSources.User.create({
      slug: 'user-b',
      name: 'User B',
      email: 'userb@project.com',
      bio: 'User B bio',
      tokenStamp: 'tokenStamp',
      role: 'CONSUMER',
      hash: '1234'
    });

    const userC = await dataSources.User.create({
      slug: 'user-c',
      name: 'User C',
      email: 'userc@project.com',
      bio: 'User C bio',
      tokenStamp: 'tokenStamp',
      role: 'CONSUMER',
      hash: '1234'
    });

    const userD = await dataSources.User.create({
      slug: 'user-d',
      name: 'User D',
      email: 'userd@project.com',
      bio: 'User D bio',
      tokenStamp: 'tokenStamp',
      role: 'CONSUMER',
      hash: '1234'
    });


    return {
      userA,
      userB,
      userC,
      userD,
    };
  },
};
