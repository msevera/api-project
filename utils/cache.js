const getFromCacheOrStoreOne = async ({ id, query, cache, model, cachePrefix, toObject }) => {
  if (!id) {
    return null;
  }

  id = id.toString();
  let resource = await cache.get(id, cachePrefix);
  if (resource) {
    return resource;
  }

  resource = await model.findOne(query);
  if (resource) {
    resource = toObject(resource);
    await cache.setEx(id, resource, cachePrefix);
    return resource;
  }

  return null;
};

const getFromCacheOrStoreOneWithLoader = async ({ id, cache, cachePrefix, cacheExpiration, loader, toObject }) => {
  if (!id) {
    return null;
  }

  id = id.toString();
  let resource = await cache?.get(id, cachePrefix);
  if (resource) {
    return resource;
  }

  resource = await loader.load(id);
  if (resource) {
    resource = toObject(resource);
    await cache?.setEx(id, resource, cachePrefix, cacheExpiration);
    return resource;
  }

  return null;
};

const getFromCacheOrStoreMany = async ({ id, queryFn, cachePrefix, cache, toObject }) => {
  id = id.toString();
  let resource = await cache?.get(id, cachePrefix);
  if (resource) {
    return resource;
  }

  resource = await queryFn();
  if (resource.length > 0) {
    resource = resource.map(c => toObject(c));
    await cache?.setEx(id, resource, cachePrefix);
    return resource;
  }
  return [];
};

module.exports = {
  getFromCacheOrStoreOneWithLoader,
  getFromCacheOrStoreOne,
  getFromCacheOrStoreMany,
};
