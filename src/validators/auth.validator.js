import Joi from 'joi';
import { UserRoles } from '../models/User.js';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;

export const registerSchema = Joi.object({
    name: Joi.string().required().max(100).messages({
        'string.empty': 'Name is required',
        'string.max': 'Name cannot exceed 100 characters'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email',
        'string.empty': 'Email is required'
    }),
    password: Joi.string().pattern(passwordRegex).required().messages({
        'string.pattern.base': 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number',
        'string.empty': 'Password is required'
    }),
    role: Joi.string().valid(...Object.values(UserRoles)).default(UserRoles.PATIENT),
    specialization: Joi.when('role', {
        is: UserRoles.DOCTOR,
        then: Joi.string().required(),
        otherwise: Joi.optional()
    }),
    licenseNumber: Joi.when('role', {
        is: Joi.valid(UserRoles.DOCTOR, UserRoles.NURSE, UserRoles.LAB_TECHNICIAN),
        then: Joi.string().required(),
        otherwise: Joi.optional()
    }),
    phoneNumber: Joi.string().optional(),
    tenantId: Joi.string().optional()
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email',
        'string.empty': 'Email is required'
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required'
    })
});

export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required()
});

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required().messages({
        'string.empty': 'Current password is required'
    }),
    newPassword: Joi.string().pattern(passwordRegex).required().messages({
        'string.pattern.base': 'New password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number',
        'string.empty': 'New password is required'
    })
});