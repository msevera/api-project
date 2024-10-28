const DomainBase = require('./domainBase');

class DomainSlug extends DomainBase {
  async getBySlug({ slug }) {
    const { dataSources } = this.ctx;
    const resource = await dataSources[this.getDataSourceName()].getBySlug(slug);

    if (!resource) {
      super.notFound();
    }

    return resource;
  }
}

module.exports = DomainSlug;
