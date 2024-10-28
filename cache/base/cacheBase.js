class CacheBase {
  constructor(client, model, keys = [], expiration = 30 * 60) {
    this.expiration = expiration; // seconds

    this.keysArray = keys;
    this.cacheKeys = keys.reduce((result, item) => {
      result[item] = item;
      return result;
    }, {});
    this.model = model;
    this.client = client;
  }

  get isReady() {
    return this.client.isReady;
  }

  get keys() {
    return this.cacheKeys;
  }

  _stringify(value) {
    return JSON.stringify(value, (k, v) => {
      return typeof v === 'bigint' ? `${v.toString()}__BigInt__` : v;
    });
  }

  _parse(value) {
    return JSON.parse(value, (k, v) => {
      return typeof v === 'string' && v.includes('__BigInt__') ? BigInt(v.split('__BigInt__')[0]) : v;
    });
  }

  buildKey(key, prefix) {
    if (!prefix) return `${this.buildModelKey()}:${key}`;

    return `${this.buildModelKey(prefix)}:${key}`;
  }

  buildModelKey(prefix) {
    if (!prefix) return `${this.model}`;

    return `${this.model}:${prefix}`;
  }

  async setEx(key, value, prefix, expiration) {
    if (!this.isReady) {
      return null;
    }

    const json = this._stringify(value);
    await this.client.setEx(this.buildKey(key.toString(), prefix), expiration || this.expiration, json);
  }

  async set(key, value, prefix) {
    if (!this.isReady) {
      return null;
    }

    const json = this._stringify(value);
    await this.client.set(this.buildKey(key.toString(), prefix), json);
  }

  async get(key, prefix) {
    if (!this.isReady) {
      return null;
    }

    const json = await this.client.get(this.buildKey(key.toString(), prefix));
    return this._parse(json);
  }

  async del(key, prefix) {
    if (!this.isReady) {
      return null;
    }

    await this.client.del(this.buildKey(key.toString(), prefix));
  }

  async deleteMany(prefix) {
    const pattern = prefix ? this.buildModelKey(prefix) : this.buildModelKey();
    // Get its keys
    const keys = await this.client.keys(`${pattern}:*`);

    if (keys.length) {
      // DEV: There is a bit of a delay between get/delete but it is unavoidable
      await this.client.del(keys);
      // Otherwise, return immediately (we are already async)
    }
  }

  async deleteByResource(resource) {
    if (!this.isReady || !resource) {
      return;
    }

    // eslint-disable-next-line
    for (const prefix of this.keysArray) {
      const key = resource[prefix];
      if (key) {
        // eslint-disable-next-line
        await this.del(key, prefix);
      }
    }
  }
}

module.exports = CacheBase;
