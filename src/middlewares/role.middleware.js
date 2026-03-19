import { ApiError } from '../utils/index.js';

/**
 * Check if user has required role
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized('Authentication required'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(ApiError.forbidden('You do not have permission to access this resource'));
        }

        next();
    };
};

/**
 * Check if user is the owner of the resource or has admin role
 * @param {Function} getResourceOwnerId - Function to extract ownerId from request
 */
export const authorizeOwner = (getResourceOwnerId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(ApiError.unauthorized('Authentication required'));
            }

            // Admin can access any resource
            if (req.user.role === 'admin') {
                return next();
            }

            const ownerId = await getResourceOwnerId(req);
            
            // Check if user is the owner
            if (req.user.userId.toString() !== ownerId.toString()) {
                return next(ApiError.forbidden('You do not have permission to access this resource'));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};