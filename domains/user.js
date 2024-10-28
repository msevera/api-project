const DomainSlug = require('./base/domainSlug');
const {signInUser, createUser} = require('../utils/auth');

class UserDomain extends DomainSlug {
  async getByEmail({email}, {throwErrorIfNotFound = true} = {throwErrorIfNotFound: true}) {
    const {dataSources} = this.ctx;
    const resource = await dataSources.User.getByEmail(email);

    return this.handleNotFound(resource, throwErrorIfNotFound);
  }

  async blockUser({userId, blocked}) {
    const {dataSources, withTransaction} = this.ctx;
    let result;

    await withTransaction(async () => {
      const user = await this.getById({id: userId});
      result = await dataSources.User.setBlockUser(user.id, blocked);
    });

    return result;
  }

  async signIn({email, password}) {
    const {withTransaction, dataSources} = this.ctx;
    let auth;
    await withTransaction(async () => {
      auth = await signInUser({email, password}, dataSources.User);
    });

    return auth;
  }

  async signUp(data) {
    const {security} = this.ctx;
    const {name, email, password, rePassword} = data;
    await this.createUser({name, email, password, rePassword, role: security.roles.consumer})
    return this.signIn({email, password});
  }

  async getMe() {
    const {dataSources, authUser} = this.ctx;

    if (!authUser.id) {
      return authUser;
    }

    return dataSources.User.getById(authUser.id);
  }

  async editProfileById({id, data}) {
    const {bio, name} = data;

    await this.validateBusinessRule({
      user: id,
    });

    const editData = {};
    if (typeof bio !== 'undefined') {
      editData.bio = bio;
    }

    if (typeof name !== 'undefined') {
      editData.name = name;
    }

    return super.editById({
      id, data: {
        ...editData,
      },
    });
  }

  async createUser({name, email, password, rePassword, role}) {
    const {dataSources} = this.ctx;
    return createUser({name, email, password, rePassword}, dataSources.User, role);
  }
}

module.exports = UserDomain;
