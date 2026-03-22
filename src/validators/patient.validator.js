import Joi from 'joi';
import { BloodGroups, Genders } from '../models/Patient.js';

export const createPatientSchema = Joi.object({
    firstName: Joi.string().required().max(50).messages({
        'string.empty': 'First name is required',
        'string.max': 'First name cannot exceed 50 characters'
    }),
    lastName: Joi.string().required().max(50).messages({
        'string.empty': 'Last name is required',
        'string.max': 'Last name cannot exceed 50 characters'
    }),
    dateOfBirth: Joi.date().required().max('now').messages({
        'date.base': 'Valid date of birth is required',
        'date.max': 'Date of birth cannot be in the future'
    }),
    gender: Joi.string().valid(...Object.values(Genders)).required(),
    phone: Joi.string().required(),
    email: Joi.string().email().optional().allow(''),
    address: Joi.object({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        postalCode: Joi.string().optional(),
        country: Joi.string().default('Nigeria')
    }),
    emergencyContact: Joi.object({
        name: Joi.string().optional(),
        relationship: Joi.string().optional(),
        phone: Joi.string().optional()
    }),
    bloodGroup: Joi.string().valid(...Object.values(BloodGroups)).default(BloodGroups.UNKNOWN),
    allergies: Joi.array().items(Joi.string()),
    chronicConditions: Joi.array().items(Joi.string()),
    hospitalId: Joi.string().required().messages({
        'string.empty': 'Hospital ID is required'
    }),
    nationalId: Joi.string().optional().allow(''),
    insuranceProvider: Joi.string().optional(),
    insuranceNumber: Joi.string().optional(),
    insuranceExpiryDate: Joi.date().optional(),
    occupation: Joi.string().optional(),
    maritalStatus: Joi.string().valid('single', 'married', 'divorced', 'widowed').optional(),
    notes: Joi.string().optional()
});

export const updatePatientSchema = Joi.object({
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    gender: Joi.string().valid(...Object.values(Genders)).optional(),
    phone: Joi.string().optional(),
    email: Joi.string().email().optional().allow(''),
    address: Joi.object({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        postalCode: Joi.string().optional(),
        country: Joi.string().optional()
    }),
    emergencyContact: Joi.object({
        name: Joi.string().optional(),
        relationship: Joi.string().optional(),
        phone: Joi.string().optional()
    }),
    bloodGroup: Joi.string().valid(...Object.values(BloodGroups)).optional(),
    allergies: Joi.array().items(Joi.string()),
    chronicConditions: Joi.array().items(Joi.string()),
    hospitalId: Joi.string().optional(),
    nationalId: Joi.string().optional().allow(''),
    insuranceProvider: Joi.string().optional(),
    insuranceNumber: Joi.string().optional(),
    insuranceExpiryDate: Joi.date().optional(),
    occupation: Joi.string().optional(),
    maritalStatus: Joi.string().valid('single', 'married', 'divorced', 'widowed').optional(),
    isActive: Joi.boolean().optional(),
    notes: Joi.string().optional()
});

export const listPatientsSchema = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    search: Joi.string().optional(),
    bloodGroup: Joi.string().valid(...Object.values(BloodGroups)).optional(),
    gender: Joi.string().valid(...Object.values(Genders)).optional(),
    isActive: Joi.boolean().optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional()
});

export const patientIdSchema = Joi.object({
    id: Joi.string().required().messages({
        'string.empty': 'Patient ID is required'
    })
});