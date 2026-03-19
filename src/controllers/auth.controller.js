import * as authService from '../services/auth.service.js';
import { asyncHandler, ApiResponse, ApiError } from '../utils/index.js';
import AuditLog from '../models/AuditLog.js';
import { AuditActions } from '../models/AuditLog.js';
import User from '../models/User.js';

/**
 * Register new user
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, role, specialization, licenseNumber, phoneNumber } = req.body;
    
    const result = await authService.registerUser({
        name,
        email,
        passwordHash: password,
        role,
        specialization,
        licenseNumber,
        phoneNumber,
        tenantId: req.body.tenantId || null
    });

  // Log registration
    await AuditLog.log({
        userId: result.user.id,
        userRole: result.user.role,
        userEmail: result.user.email,
        userName: result.user.name,
        action: AuditActions.USER_CREATED,
        resourceType: 'user',
        resourceId: result.user.id,
        resourceName: result.user.name,
        tenantId: result.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `New user registered: ${result.user.email}`,
        metadata: { role: result.user.role }
    });

    return ApiResponse.created(result, 'User registered successfully').send(res);
});

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    const result = await authService.loginUser(email, password, req.ip);

  // Log login
    await AuditLog.log({
        userId: result.user.id,
        userRole: result.user.role,
        userEmail: result.user.email,
        userName: result.user.name,
        action: AuditActions.LOGIN_SUCCESS,
        resourceType: 'user',
        resourceId: result.user.id,
        resourceName: result.user.name,
        tenantId: result.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `User logged in: ${result.user.email}`
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return ApiResponse.success({
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn
    }, 'Login successful').send(res);
});

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
        throw ApiError.unauthorized('Refresh token required');
    }

    const tokens = await authService.refreshUserToken(refreshToken);

    // Set new refresh token in cookie
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ApiResponse.success({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn
    }, 'Token refreshed successfully').send(res);
});

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken && req.user) {
        await authService.logoutUser(req.user.userId, refreshToken);
        
        // Log logout
        await AuditLog.log({
            userId: req.user.userId,
            userRole: req.user.role,
            userEmail: req.user.email,
            userName: req.user.name,
            action: AuditActions.LOGOUT,
            resourceType: 'user',
            resourceId: req.user.userId,
            tenantId: req.user.tenantId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            description: 'User logged out'
        });
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    return ApiResponse.success(null, 'Logout successful').send(res);
});

/**
 * Change password
 * POST /api/v1/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    await authService.changeUserPassword(req.user.userId, currentPassword, newPassword);

  // Log password change
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.PASSWORD_CHANGE,
        resourceType: 'user',
        resourceId: req.user.userId,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: 'Password changed successfully'
    });

    return ApiResponse.success(null, 'Password changed successfully').send(res);
});

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
        throw ApiError.notFound('User not found');
    }

    return ApiResponse.success(user.toProfileJSON(), 'User profile retrieved').send(res);
});