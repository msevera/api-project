class DomainFactory {
  constructor({ domains }) {
    this.domains = domains;
  }

  secureDomainInstance(model, context) {
    const { security, authUser, skipAuth } = context;
    const domainInstance = new this.domains[model](context, model);
    Object.keys(security?.access[model]?.permissions || {})?.forEach(item => {
      const prop = security.access[model].permissions[item];
      if (domainInstance[prop]) {
        domainInstance[`${prop}_secured`] = domainInstance[prop];
        if (typeof domainInstance[`${prop}_secured`] === 'function') {
          domainInstance[prop] = async (...args) => {
            if (!skipAuth) {
              await security.authorization.authorize(authUser, model, prop);
            }

            return domainInstance[`${prop}_secured`](...args);
          };
        }
      }
    });

    return domainInstance;
  }

  init() {
    this.creators = Object.keys(this.domains).reduce((result, key) => {
      result[key] = context => this.secureDomainInstance(key, context);
      return result;
    }, {});
  }

  getDomains() {
    return this.creators;
  }
}

module.exports = DomainFactory;
