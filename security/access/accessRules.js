const { roles } = require('../roles');

const ownerOrAdmin = (entity, user) => {
  return (entity.user && entity.user.toString() === (user.id && user.id.toString())) || user.role.includes(roles.admin);
};

const admin = user => {
  return user.role.includes(roles.admin);
};

const owner = (entity, user) => {
  return !!(entity.user && entity.user.toString() === (user.id && user.id.toString()));
};

const any = () => true;

module.exports = {
  ownerOrAdmin,
  any,
  owner,
  admin,
};
