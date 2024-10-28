const Access = require('./access');
const { ownerOrAdmin } = require('./accessRules');

const editProfileById = async (entity, authUser) => {
  if (!ownerOrAdmin(entity, authUser)) {
    return 'Can not edit profile for non owner or admin';
  }

  return true;
};

class User extends Access {
  constructor() {
    super('User');
    this.permissions = [
      {
        key: User.permissions.editProfileById,
        validator: editProfileById,
      }
    ];
  }
}

User.permissions = {
  editProfileById: 'editProfileById'
};

module.exports = User;
