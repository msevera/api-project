const {ForbiddenError, BadRequestError} = require('../graphql/errors');
const {
    UserAccess,
    ProductAccess,
} = require('./access');

const productAccess = new ProductAccess();
const userAccess = new UserAccess();

const access = {
    [productAccess.entity]: productAccess,
    [userAccess.entity]: userAccess,
};

class RBACAuthorization {
    constructor() {
        this.entityAccess = access;
    }

    async authorize() {
        return true;
    }

    async checkEntityBusinessRule(entityType, permissionKey, entity, authUser, ctx) {
        let validationResult;
        try {
            validationResult = await this.entityAccess[entityType].validatePermission(permissionKey, entity, authUser, ctx);
        } catch (error) {
            if (error instanceof BadRequestError) {
                validationResult = false;
            }
        }

        if (typeof validationResult === 'boolean') {
            return validationResult;
        }

        if (typeof validationResult === 'string') {
            return !validationResult;
        }

        return false;
    }

    async validateEntityBusinessRule(entityType, permissionKey, entity, authUser, ctx) {
        const validationResult = await this.entityAccess[entityType].validatePermission(
            permissionKey,
            entity,
            authUser,
            ctx
        );
        if (typeof validationResult === 'boolean') {
            if (!validationResult) {
                throw new ForbiddenError(`Can not perform this action. Check ${entityType} ${permissionKey} rules`);
            }
        }

        if (typeof validationResult === 'string') {
            if (validationResult) {
                throw new ForbiddenError(validationResult);
            }
        }
    }
}

module.exports.RBACAuthorization = RBACAuthorization;

module.exports.access = Object.keys(access).reduce((result, k) => {
    result[k] = {
        entity: k,
        permissions: access[k].getPermissionsKeys().reduce((r, p) => {
            r[p] = p;
            return r;
        }, {}),
    };
    return result;
}, {});
