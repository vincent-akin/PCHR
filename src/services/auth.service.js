import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/config.js';
import ApiError from '../utils/ApiError.js'


/**
 * Check if user exists
 */
export const checkExistingUser = async (email) => {
    return await User.findOne({ email });
};

/**
 * Generate JWT tokens
 */
export const generateAuthTokens = async (user) => {
    const payload = {
        userId: user._id,
        role: user.role,
        tenantId: user.tenantId
    };

    // Access token (short-lived)
    const accessToken = jwt.sign(
        payload,
        config.jwt.secret,
        {
            expiresIn: config.jwt.accessExpiration,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience
        }
    );

    // Refresh token (long-lived)
    const refreshToken = jwt.sign(
        { userId: user._id },
        config.jwt.secret,
        {
            expiresIn: config.jwt.refreshExpiration,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience
        }
    );

  // Save refresh token to user
  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    expiresIn: 900 // 15 minutes in seconds
  };
};

/**
 * Register a new user
 */
export const registerUser = async (userData) => {
    // Check if user already exists
    const existingUser = await checkExistingUser(userData.email);
    if (existingUser) {
        throw ApiError.conflict('User with this email already exists');
    }

    // Create new user
    const user = await User.create({
        ...userData,
        // Password will be hashed by the pre-save hook
    });

    // Generate tokens
    const tokens = await generateAuthTokens(user);

    return {
        user: user.toProfileJSON(),
        tokens
    };
};

/**
 * Login user
 */
export const loginUser = async (email, password, ipAddress) => {
    // Find user with password field included
    const user = await User.findOne({ email }).select('+passwordHash');
    
    if (!user) {
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
        throw ApiError.unauthorized('Account is deactivated. Please contact administrator');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = await generateAuthTokens(user);

    return {
        user: user.toProfileJSON(),
        tokens
    };
};

/**
 * Refresh access token using refresh token
 */
export const refreshUserToken = async (refreshToken) => {
    try {
        // Verify refresh token
        const payload = jwt.verify(refreshToken, config.jwt.secret, {
            issuer: config.jwt.issuer,
            audience: config.jwt.audience
        });

        // Find user
        const user = await User.findById(payload.userId).select('+refreshToken');
    
        if (!user) {
            throw ApiError.unauthorized('User not found');
        }

        // Check if refresh token matches
        if (user.refreshToken !== refreshToken) {
            throw ApiError.unauthorized('Invalid refresh token');
        }

        // Generate new tokens
        const tokens = await generateAuthTokens(user);

        return tokens;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw ApiError.unauthorized('Refresh token expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw ApiError.unauthorized('Invalid refresh token');
        }
        throw error;
    }
};

/**
 * Logout user
 */
export const logoutUser = async (userId, refreshToken) => {
  // Clear refresh token from database
    await User.findByIdAndUpdate(userId, { 
        $unset: { refreshToken: 1 } 
    });
    
    return { success: true };
};

/**
 * Change password
 */
export const changeUserPassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+passwordHash');
    
    if (!user) {
        throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
        throw ApiError.unauthorized('Current password is incorrect');
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();

    return { success: true };
};

/**
 * Verify token (for middleware)
 */
    export const verifyToken = (token) => {
    try {
        const payload = jwt.verify(token, config.jwt.secret, {
            issuer: config.jwt.issuer,
            audience: config.jwt.audience
        });
            return payload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw ApiError.unauthorized('Token expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw ApiError.unauthorized('Invalid token');
            }
        throw error;
    }
};