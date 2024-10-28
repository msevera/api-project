const DataLoader = require('dataloader');
const DataSourceSlug = require('./base/dataSourceSlug');

class UserDataSource extends DataSourceSlug {
  constructor(props) {
    super({ ...props, modelKey: 'User' });

    this.resourceByAddressLoader = new DataLoader(async addresses => {
      const resources = await this.model.find({ address: { $in: addresses } }).session(this.session);
      return addresses.map(address => resources.find(s => s.address.toString() === address.toString()));
    });

    this.resourceByDidLoader = new DataLoader(async dids => {
      const resources = await this.model.find({ did: { $in: dids } }).session(this.session);
      return dids.map(did => resources.find(s => s.did.toString() === did.toString()));
    });

    this.resourceByEmailLoader = new DataLoader(async emails => {
      const resources = await this.model.find({ email: { $in: emails } }).session(this.session);
      return emails.map(em => resources.find(s => s.email.toString().toLowerCase() === em.toString().toLowerCase()));
    });
  }

  async setBlockUser(id, blocked) {
    let user = await this.model.findOneAndUpdate(
      { _id: id },
      { $set: { blocked, blockedAt: new Date() } },
      { new: true, runValidators: true, session: this.session }
    );

    if (user) {
      user = user.toObject();
      await this.cache.deleteByResource(user);
    }

    return user;
  }

  async getByEmail(email) {
    const resource = await this.resourceByEmailLoader.load(email);
    return resource ? this.toObject(resource) : null;
  }
}

module.exports = UserDataSource;
