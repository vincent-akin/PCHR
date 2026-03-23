import Joi from 'joi';
import { TransferStatus, TransferTypes } from '../models/Transfer.js';

export const createTransferSchema = Joi.object({
    patientId: Joi.string().required(),
    toTenant: Joi.string().required(),
    type: Joi.string().valid(...Object.values(TransferTypes)).default(TransferTypes.FULL_RECORD),
    requestNotes: Joi.string().optional(),
    patientConsent: Joi.object({
        obtained: Joi.boolean().required(),
        obtainedAt: Joi.date(),
        consentMethod: Joi.string().valid('written', 'digital', 'verbal'),
        consentDocument: Joi.string()
    }).required(),
    selectedRecords: Joi.when('type', {
        is: TransferTypes.SELECTED_RECORDS,
        then: Joi.array().items(
        Joi.object({
            recordId: Joi.string().required(),
            included: Joi.boolean(),
            reason: Joi.string()
        })
        ).min(1),
        otherwise: Joi.forbidden()
    }),
    dateRange: Joi.object({
        from: Joi.date(),
        to: Joi.date()
    }),
    purpose: Joi.string(),
    accessPin: Joi.string().length(4).pattern(/^[0-9]+$/)
});

export const updateTransferSchema = Joi.object({
    status: Joi.string().valid(TransferStatus.CANCELLED).optional()
});

export const approveTransferSchema = Joi.object({
    notes: Joi.string().optional()
});

export const rejectTransferSchema = Joi.object({
    reason: Joi.string().required()
});

export const transferIdSchema = Joi.object({
    id: Joi.string().required()
});

export const listTransfersSchema = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    status: Joi.string().valid(...Object.values(TransferStatus)),
    patientId: Joi.string(),
    fromTenant: Joi.string(),
    toTenant: Joi.string(),
    fromDate: Joi.date(),
    toDate: Joi.date()
});