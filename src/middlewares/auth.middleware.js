import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/index.js';
import config from '../config/config.js';
import User from '../models/User.js';
import * as authService from '../services/auth.service.js';

export const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('No token provided');
        }

        const token = authHeader.split(' ')[1];

        // Verify token using service
        const payload = authService.verifyToken(token);

        // Check if user still exists
        const user = await User.findById(payload.userId).select('name email role tenantId isActive');
        
        if (!user) {
        throw ApiError.unauthorized('User not found');
        }

        if (!user.isActive) {
        throw ApiError.unauthorized('User account is deactivated');
        }

        // Attach user to request
        req.user = {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
        };

        next();
    } catch (error) {
        next(error);
    }
};