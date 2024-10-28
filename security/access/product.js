const Access = require('./access');
const {ownerOrAdmin} = require('./accessRules');

const editById = (entity, authUser) => {
  if (
    !ownerOrAdmin(
      {
        user: entity.owner,
      },
      authUser
    )
  ) {
    return false;
  }

  return true;
};

class Product extends Access {
  constructor() {
    super('Product');
    this.permissions = [
      {
        key: Product.permissions.editById,
        validator: editById,
      }
    ];
  }
}

Product.permissions = {
  editById: 'editById'
};

module.exports = Product;
