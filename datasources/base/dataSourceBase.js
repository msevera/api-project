const DataLoader = require('dataloader');
const { DataSource } = require('apollo-datasource');
const { InternalServerError } = require('../../error');
const { getFromCacheOrStoreOne, getFromCacheOrStoreOneWithLoader } = require('../../utils/cache');
const { BadRequestError } = require('../../graphql/errors');
const { errorCodes } = require('../../utils/errorUtils');

class DataSourceBase extends DataSource {
  constructor({ store, cache, modelKey }) {
    super();

    this.modelKey = modelKey;
    this.store = store;
    this.cache = cache?.[modelKey];
    this.model = store.getModels()[modelKey];
    this.resourceByIdLoader = new DataLoader(async ids => {
      const resources = await this.model.find({ _id: { $in: ids } }).session(this.session);
      return ids.map(id => resources.find(s => s._id.toString() === id.toString()));
    });

    this.sortDefault = { by: 'createdAt', order: 'desc' };
    this.limitDefault = 30;
    this.limitMax = 100;
  }

  get modelInstance() {
    return this.model;
  }

  set transaction(value) {
    this._transaction = value;
  }

  get session() {
    const { session } = this._transaction || {};
    return session && !session?.hasEnded && session.transaction && session.transaction.isActive ? session : undefined;
  }

  transformProjectionFields(fields) {
    const idField = fields.find(f => f === 'id');
    if (idField) {
      fields = [...fields.filter(f => f !== 'id'), '_id'];
    }

    return fields;
  }

  toObject(resource) {
    return resource.toObject();
  }

  async getByIds(ids) {
    const resources = await this.model.find({ _id: { $in: ids } });
    return resources.length > 0 ? resources.map(p => this.toObject(p)) : [];
  }

  async getById(id) {
    const resource = await getFromCacheOrStoreOneWithLoader({
      id,
      cache: this.cache,
      loader: this.resourceByIdLoader,
      cachePrefix: this.cache?.keys?.id,
      toObject: this.toObject,
    });

    if (!resource) {
      this.resourceByIdLoader.clear(id);
    }

    return resource;
  }

  _handleListPagination(pagination) {
    const { cursorNext = 0, cursorPrevious, limit = this.limitDefault, sort = this.sortDefault } = pagination || {};

    if (limit > this.limitMax) {
      throw new InternalServerError(`Limit should not exceed ${this.limitMax} items`, errorCodes.LIMIT_EXCEEDED);
    }

    const _order = sort.order === 'asc' ? 1 : -1;
    const sortOrder = Array.isArray(sort.by) ? sort.by.map(m => [m, _order]) : { [sort.by]: _order };

    return {
      sort: sortOrder,
      next: parseInt(cursorNext, 10),
      previous: cursorPrevious,
      limit,
    };
  }

  _handleListResults(resources) {
    return {
      items:
        resources.results.length > 0
          ? resources.results.map(u => ({
              ...u,
              id: u._id.toString(),
            }))
          : [],
      pageInfo: {
        previous: resources.previous,
        next: resources.next,
        hasPrevious: resources.hasPrevious,
        hasNext: resources.hasNext,
      },
    };
  }

  async getListAggregate({ aggregation = {}, pagination = {} }) {
    const { paginatedField, next, previous, limit, sortAscending } = this._handleListPagination(pagination);

    const requests = await this.model.cAggregate({
      aggregation,
      paginatedField,
      next,
      previous,
      limit,
      sortAscending,
    });

    return this._handleListResults(requests);
  }

  async getList({ query = {}, pagination = {} }) {
    const { next, limit, sort } = this._handleListPagination(pagination);
    const results = await this.model
      .find(query)
      .session(this.session)
      .sort(sort)
      .skip(next * limit)
      .limit(limit + 1);

    const hasNext = results.length > limit;
    const items = hasNext ? results.slice(0, results.length - 1) : results;

    const total = await this.model.countDocuments(query);

    const listResult = this._handleListResults({
      results: items.map(item => item.toObject()),
      next: hasNext ? parseInt(next, 10) + 1 : null,
      hasNext,
      previous: null,
      hasPrevious: false,
    });

    return {
      ...listResult,
      pageInfo: {
        ...listResult.pageInfo,
        total,
      },
    };
  }

  async getAll({ query = {} } = { query: {} }, { fields } = { fields: [] }) {
    const optionsArg = {};
    if (fields.length > 0) {
      optionsArg.projection = this.transformProjectionFields(fields);
    }
    const resources = await this.model.find(query, optionsArg.projection);
    return resources.length > 0 ? resources.map(p => this.toObject(p)) : [];
  }

  normalize(data) {
    return data;
  }

  async create(data) {
    try {
      const [resource] = await this.model.create([this.normalize(data)], {
        session: this.session,
      });
      return resource ? this.toObject(resource) : null;
    } catch (err) {
      if (err.code === 11000) {
        throw new BadRequestError(`${this.modelKey} already exists`, errorCodes.RESOURCE_ALREADY_EXISTS);
      } else {
        throw err;
      }
    }
  }

  async editById(id, data, inc, push) {
    const cmds = {};

    if (typeof data !== 'undefined') {
      cmds.$set = this.normalize(data);
    }

    if (typeof inc !== 'undefined') {
      cmds.$inc = inc;
    }

    if (typeof push !== 'undefined') {
      const pushCmd = {};
      // eslint-disable-next-line
      for (const prop in push) {
        if (!pushCmd[prop]) {
          pushCmd[prop] = {};
        }

        const propValue = push[prop];
        pushCmd[prop].$each = propValue.array;
        if (typeof propValue.position !== 'undefined') {
          pushCmd[prop].$position = propValue.position;
        }

        if (typeof propValue.slice !== 'undefined') {
          pushCmd[prop].$slice = propValue.slice;
        }
      }

      cmds.$push = pushCmd;
    }

    const resource = await this.model.findOneAndUpdate({ _id: id }, cmds, {
      runValidators: true,
      session: this.session,
      new: true,
    });

    return this._postEditCacheCleanup(resource);
  }

  async updateMany(filter = {}, update = {}, options = {}) {
    const resources = await this.model.updateMany(filter, update, {
      session: this.session,
      ...options,
    });

    return resources;
  }

  async _postEditCacheCleanup(resource) {
    if (resource) {
      resource = this.toObject(resource);
      await this.cache?.deleteByResource(resource);
      this.resourceByIdLoader.clear(resource.id);
    }

    return resource;
  }

  async deleteById({ id }) {
    const resource = await getFromCacheOrStoreOne({
      id,
      query: { _id: id },
      cache: this.cache,
      model: this.model,
      cachePrefix: this.cache?.keys?.id,
      toObject: this.toObject,
    });
    await this.model.deleteOne({ _id: id }).session(this.session);
    await this.cache?.deleteByResource(resource);
    this.resourceByIdLoader.clear(id);
  }
}

module.exports = DataSourceBase;
