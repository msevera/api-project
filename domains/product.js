const DomainSlug = require('./base/domainSlug');

class ProductDomain extends DomainSlug {
  async editById({id, data}) {
    const {withTransaction} = this.ctx;

    const {
      name,
      description,
    } = data;

    let product = await super.getById({id});
    await this.validateBusinessRule({
      name,
      description,
      owner: product.owner
    });

    await withTransaction(async () => {
      product = await super.editById({
        id,
        data: {
          name,
          description
        },
      });
    });

    return product;
  }

  async create({data}) {
    const {withTransaction, authUser} = this.ctx;

    const {
      name,
      description,
    } = data;

    let product;
    await withTransaction(async () => {
      product = await super.create({
        data: {
          name,
          description,
          owner: authUser.id
        },
      });
    });

    return product;
  }

  async getList({input, pagination}) {
    const {dataSources} = this.ctx;

    const {ownerId} = input;

    return dataSources.Product.getList({
      ownerId,
      pagination,
    });
  }
}

module.exports = ProductDomain;
