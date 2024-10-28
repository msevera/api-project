exports.resolver = {
  Product: {

    owner: async (parent, args, ctx) => {
      const userDomain = ctx.domains.User(ctx);
      return userDomain.getById({id: parent.owner});
    }
  },
  Query: {
    getProductById: async (parent, {id}, ctx) => {
      const productDomain = ctx.domains.Product(ctx);
      return productDomain.getById({id});
    },
    getProductsList: async (parent, {input, pagination}, ctx) => {
      const productDomain = ctx.domains.Product(ctx);
      return productDomain.getList({input, pagination});
    },
    getProductBySlug: async (parent, {slug}, ctx) => {
      const productDomain = ctx.domains.Product(ctx);
      return productDomain.getBySlug({slug});
    },
  },
  Mutation: {
    createProduct: async (parent, {data}, ctx) => {
      const productDomain = ctx.domains.Product(ctx);
      return productDomain.create({data});
    },
    editProductById: async (parent, {id, data}, ctx) => {
      const productDomain = ctx.domains.Product(ctx);
      return productDomain.editById({id, data});
    }
  },
};
