class Access {
  constructor(Entity) {
    this.entity = Entity;
    this.permissions = [];
  }

  validatePermission(permissionKey, entity, authUser, ctx) {
    const permission = this.permissions.find(p => p.key === permissionKey);
    if (!permission) {
      throw new Error(`No permission ${permissionKey} in ${this.entity} found`);
    }

    return permission.validator(entity, authUser, ctx);
  }

  getPermissionsKeys() {
    return this.permissions.map(p => p.key);
  }
}

module.exports = Access;
