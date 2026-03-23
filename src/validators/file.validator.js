import Joi from 'joi';
import { FileTypes } from '../models/File.js';

export const fileMetadataSchema = Joi.object({
    patientId: Joi.string().required(),
    recordId: Joi.string().optional(),
    category: Joi.string().valid(...Object.values(FileTypes)).required(),
    fileType: Joi.string().valid(...Object.values(FileTypes)).optional(),
    description: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional()
});

export const fileIdSchema = Joi.object({
    id: Joi.string().required()
});

export const patientIdSchema = Joi.object({
    patientId: Joi.string().required()
});

export const recordIdSchema = Joi.object({
    recordId: Joi.string().required()
});

export const listFilesSchema = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    category: Joi.string().valid(...Object.values(FileTypes)),
    fileType: Joi.string().valid(...Object.values(FileTypes)),
    search: Joi.string()
});