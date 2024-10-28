const DataLoader = require('dataloader');
const { getFromCacheOrStoreOneWithLoader } = require('../../utils/cache');
const DataSourceBase = require('./dataSourceBase');

class DataSourceBaseSlug extends DataSourceBase {
  constructor(props) {
    super(props);
    this.resourceBySlugLoader = new DataLoader(async slugs => {
      const resources = await this.model.find({ slug: { $in: slugs } }).session(this.session);
      return slugs.map(slug => resources.find(s => s.slug === slug));
    });
  }

  async getBySlug(slug) {
    return getFromCacheOrStoreOneWithLoader({
      id: slug?.trim(),
      cache: this.cache,
      loader: this.resourceBySlugLoader,
      cachePrefix: this.cache.keys.slug,
      toObject: this.toObject,
    });
  }
}

module.exports = DataSourceBaseSlug;
