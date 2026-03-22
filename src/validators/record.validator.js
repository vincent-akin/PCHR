import Joi from 'joi';
import { RecordTypes, RecordStatus, ConfidentialityLevels } from '../models/MedicalRecord.js';

export const createRecordSchema = Joi.object({
    patientId: Joi.string().required().messages({
        'string.empty': 'Patient ID is required'
    }),
    type: Joi.string().valid(...Object.values(RecordTypes)).required(),
    title: Joi.string().required().max(200),
    description: Joi.string().optional(),
    notes: Joi.string().required(),
    status: Joi.string().valid(...Object.values(RecordStatus)).default(RecordStatus.FINAL),
    confidentiality: Joi.string().valid(...Object.values(ConfidentialityLevels)).default(ConfidentialityLevels.NORMAL),
    diagnosis: Joi.array().items(
        Joi.object({
        code: Joi.string().required(),
        description: Joi.string().required(),
        isPrimary: Joi.boolean().default(false)
        })
    ),
    procedures: Joi.array().items(
        Joi.object({
            code: Joi.string(),
            description: Joi.string(),
            date: Joi.date(),
            notes: Joi.string()
        })
    ),
    medications: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            dosage: Joi.string().required(),
            frequency: Joi.string().required(),
            route: Joi.string(),
            duration: Joi.string(),
            instructions: Joi.string(),
            prescribedDate: Joi.date().default(Date.now)
        })
    ),
    vitalSigns: Joi.object({
            bloodPressure: Joi.object({
            systolic: Joi.number(),
            diastolic: Joi.number()
        }),
        heartRate: Joi.number(),
        respiratoryRate: Joi.number(),
        temperature: Joi.number(),
        oxygenSaturation: Joi.number(),
        height: Joi.number(),
        weight: Joi.number(),
        bmi: Joi.number()
    }),
    labResults: Joi.array().items(
        Joi.object({
            testName: Joi.string().required(),
            testCode: Joi.string(),
            result: Joi.string().required(),
            unit: Joi.string(),
            referenceRange: Joi.string(),
            isAbnormal: Joi.boolean(),
            performedDate: Joi.date(),
            reportedDate: Joi.date()
        })
    ),
    imagingResults: Joi.array().items(
        Joi.object({
            modality: Joi.string(),
            bodyPart: Joi.string(),
            findings: Joi.string(),
            impression: Joi.string(),
            performedDate: Joi.date(),
            reportedDate: Joi.date()
        })
    ),
    followUpRequired: Joi.boolean().default(false),
    followUpDate: Joi.date().optional(),
    followUpInstructions: Joi.string().optional(),
    doctorSignature: Joi.object({
        signed: Joi.boolean().default(false),
        signedAt: Joi.date()
    })
});

export const updateRecordSchema = Joi.object({
    title: Joi.string().max(200).optional(),
    description: Joi.string().optional(),
    notes: Joi.string().optional(),
    status: Joi.string().valid(...Object.values(RecordStatus)).optional(),
    confidentiality: Joi.string().valid(...Object.values(ConfidentialityLevels)).optional(),
    diagnosis: Joi.array().items(
        Joi.object({
            code: Joi.string().required(),
            description: Joi.string().required(),
            isPrimary: Joi.boolean().default(false)
        })
    ),
    procedures: Joi.array().items(
        Joi.object({
        code: Joi.string(),
        description: Joi.string(),
        date: Joi.date(),
        notes: Joi.string()
    })
    ),
    medications: Joi.array().items(
        Joi.object({
        name: Joi.string().required(),
        dosage: Joi.string().required(),
        frequency: Joi.string().required(),
        route: Joi.string(),
        duration: Joi.string(),
        instructions: Joi.string(),
        prescribedDate: Joi.date()
        })
    ),
    vitalSigns: Joi.object({
        bloodPressure: Joi.object({
        systolic: Joi.number(),
        diastolic: Joi.number()
        }),
        heartRate: Joi.number(),
        respiratoryRate: Joi.number(),
        temperature: Joi.number(),
        oxygenSaturation: Joi.number(),
        height: Joi.number(),
        weight: Joi.number(),
        bmi: Joi.number()
    }),
    followUpRequired: Joi.boolean(),
    followUpDate: Joi.date(),
    followUpInstructions: Joi.string(),
    doctorSignature: Joi.object({
        signed: Joi.boolean(),
        signedAt: Joi.date()
    })
});

export const listRecordsSchema = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    type: Joi.string().valid(...Object.values(RecordTypes)),
    status: Joi.string().valid(...Object.values(RecordStatus)),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    search: Joi.string()
});

export const recordIdSchema = Joi.object({
    id: Joi.string().required()
});

export const patientIdSchema = Joi.object({
    patientId: Joi.string().required()
});