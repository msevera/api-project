const { NotFoundError } = require('../../graphql/errors');

class DomainBase {
  constructor(
    { dataSources, authUser, services, skipAuth, security, domains, cache, transaction, startTransaction },
    model
  ) {
    if (transaction) {
      // eslint-disable-next-line
      for (const ds in dataSources) {
        dataSources[ds].transaction = transaction;
      }
    }

    this.model = model;
    this.ctx = {
      dataSources,
      authUser,
      services,
      security,
      domains,
      transaction,
      skipAuth,
      cache,
      withTransaction: transaction
        ? transaction.withTransaction.bind(transaction, !transaction?.started)
        : async fn => {
            await fn();
          },
      startTransaction,
    };
  }

  handleNotFound(resource, throwErrorIfNotFound) {
    if (!resource && throwErrorIfNotFound) {
      this.notFound();
    }

    return resource;
  }

  getDataSourceName() {
    return this.model;
  }

  async validateEntityBusinessRule(permissionKey, entity, authUser) {
    if (this.ctx.skipAuth) return;
    await this.ctx.security.authorization.validateEntityBusinessRule(
      this.model,
      permissionKey,
      entity,
      authUser || this.ctx.authUser,
      this.ctx
    );
  }

  async checkEntityBusinessRule(permissionKey, entity, authUser) {
    if (this.ctx.skipAuth) return true;
    return this.ctx.security.authorization.checkEntityBusinessRule(
      this.model,
      permissionKey,
      entity,
      authUser || this.ctx.authUser
    );
  }

  async getById({ id }, { throwErrorIfNotFound = true } = { throwErrorIfNotFound: true }) {
    const { dataSources } = this.ctx;
    const resource = await dataSources[this.getDataSourceName()].getById(id);
    return this.handleNotFound(resource, throwErrorIfNotFound);
  }

  async getList({ pagination } = {}) {
    const { dataSources } = this.ctx;
    return dataSources[this.getDataSourceName()].getList({
      pagination,
    });
  }

  async create({ data }) {
    const { dataSources } = this.ctx;
    return dataSources[this.getDataSourceName()].create(data);
  }

  async deleteById({ id }) {
    const { dataSources } = this.ctx;
    return dataSources[this.getDataSourceName()].deleteById({ id });
  }

  async editById({ id, data, inc, push, addToSet }) {
    const { dataSources } = this.ctx;
    return dataSources[this.getDataSourceName()].editById(id, data, inc, push, addToSet);
  }

  async updateMany(filter = {}, update = {}, options = {}) {
    const { dataSources } = this.ctx;
    return dataSources[this.getDataSourceName()].updateMany(filter, update, options);
  }

  notFound({ message, reason } = {}) {
    throw new NotFoundError(message || `${this.model} not found`, reason || this.model);
  }

  getCallerName() {
    const ex = new Error();
    const [className, functionName] = ex.stack.split('\n')[3].trim().split(' ')[1].trim().split('.');
    return [className.replace('Domain', ''), functionName];
  }

  async validateBusinessRule(entity, authUser) {
    const { security } = this.ctx;
    const [className, functionName] = this.getCallerName();
    await this.validateEntityBusinessRule(security.access[className].permissions[functionName], entity, authUser);
  }

  async checkBusinessRule(entity, authUser) {
    const { security } = this.ctx;
    const [className, functionName] = this.getCallerName();
    return this.checkEntityBusinessRule(security.access[className].permissions[functionName], entity, authUser);
  }
}

module.exports = DomainBase;
