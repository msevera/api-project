const { Types } = require('mongoose');
const DataSourceSlug = require('./base/dataSourceSlug');

class ProductDataSource extends DataSourceSlug {
  constructor(props) {
    super({ ...props, modelKey: 'Product' });
  }

  _buildListQuery({ ownerId }) {
    const query = {};

    if (typeof ownerId !== 'undefined') {
      query.owner = new Types.ObjectId(ownerId);
    }

    return query;
  }

  async getList({ ownerId, pagination }) {
    const query = this._buildListQuery({ ownerId });

    return super.getList({ query, pagination });
  }
}

module.exports = ProductDataSource;
