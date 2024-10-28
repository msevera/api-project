const CacheBase = require('./base/cacheBase');

class Product extends CacheBase {
  constructor(client) {
    super(client, 'Product', ['id', 'slug']);
  }
}

module.exports = Product;
