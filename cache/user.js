const CacheBase = require('./base/cacheBase');

class User extends CacheBase {
  constructor(client) {
    super(client, 'User', ['id', 'slug']);
  }
}

module.exports = User;
