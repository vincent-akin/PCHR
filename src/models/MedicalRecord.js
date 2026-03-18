import mongoose from 'mongoose';
import createBaseSchema from './base.model.js';

// Record types from PRD
export const RecordTypes = {
    CONSULTATION: 'consultation',
    DIAGNOSIS: 'diagnosis',
    PRESCRIPTION: 'prescription',
    LAB_RESULT: 'lab_result',
    RADIOLOGY_REPORT: 'radiology_report',
    SURGERY_HISTORY: 'surgery_history',
    VACCINATION: 'vaccination',
    DISCHARGE_SUMMARY: 'discharge_summary',
    REFERRAL: 'referral'
};

// Record status
export const RecordStatus = {
    DRAFT: 'draft',
    FINAL: 'final',
    AMENDED: 'amended',
    CANCELLED: 'cancelled'
};

// Confidentiality levels
export const ConfidentialityLevels = {
    NORMAL: 'normal',
    RESTRICTED: 'restricted',
    CONFIDENTIAL: 'confidential',
    SECRET: 'secret'
};

const medicalRecordSchemaFields = {
    // Core fields
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient ID is required'],
        index: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Doctor ID is required'],
        index: true
    },
    
  // Record metadata
    type: {
        type: String,
        enum: Object.values(RecordTypes),
        required: [true, 'Record type is required'],
        index: true
    },
    status: {
        type: String,
        enum: Object.values(RecordStatus),
        default: RecordStatus.FINAL
    },
    confidentiality: {
        type: String,
        enum: Object.values(ConfidentialityLevels),
        default: ConfidentialityLevels.NORMAL
    },
    
  // Clinical content
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        required: [true, 'Clinical notes are required']
    },
    
    // Diagnosis (coded)
    diagnosis: [{
        code: String,        // ICD-10 or other coding system
        description: String,
        isPrimary: Boolean
    }],
    
    // Procedures
    procedures: [{
        code: String,        // CPT or other coding system
        description: String,
        date: Date,
        notes: String
    }],
    
    // Medications prescribed
    medications: [{
        name: String,
        dosage: String,
        frequency: String,
        route: String,       // oral, IV, topical, etc.
        duration: String,
        instructions: String,
        prescribedDate: Date
    }],
    
  // Vital signs (for consultations)
    vitalSigns: {
        bloodPressure: {
            systolic: Number,
            diastolic: Number
        },
        heartRate: Number,
        respiratoryRate: Number,
        temperature: Number,
        oxygenSaturation: Number,
        height: Number,
        weight: Number,
        bmi: Number
    },
    
    // Lab results (for lab records)
    labResults: [{
        testName: String,
        testCode: String,
        result: String,
        unit: String,
        referenceRange: String,
        isAbnormal: Boolean,
        performedDate: Date,
        reportedDate: Date
    }],
    
    // Radiology/Imaging results
    imagingResults: [{
        modality: String,    // X-ray, MRI, CT, Ultrasound
        bodyPart: String,
        findings: String,
        impression: String,
        performedDate: Date,
        reportedDate: Date
    }],
    
    // Attachments (files)
    attachments: [{
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File'
        },
        fileName: String,
        fileType: String,
        fileSize: Number,
        url: String,
        uploadedAt: Date
    }],
    
    // Follow-up information
    followUpRequired: {
        type: Boolean,
        default: false
    },
    followUpDate: Date,
    followUpInstructions: String,
    
    // Record relationships (for linking records)
    relatedRecords: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalRecord'
    }],
    
  // Signatures
    doctorSignature: {
        signed: { type: Boolean, default: false },
        signedAt: Date,
        signedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    
    // For amended records
    amendedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalRecord'
    },
    amendmentReason: String,
    
    // Access tracking
    lastAccessedAt: Date,
    lastAccessedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
};

const medicalRecordSchema = createBaseSchema(medicalRecordSchemaFields, {
    indexes: [
        { patientId: 1, createdAt: -1 },
        { doctorId: 1, createdAt: -1 },
        { type: 1, tenantId: 1 },
        { status: 1 },
        { 'diagnosis.code': 1 },
        { followUpDate: 1 }
    ]
});

// Index for full-text search
medicalRecordSchema.index({ 
    title: 'text', 
    notes: 'text', 
    description: 'text',
    'diagnosis.description': 'text'
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;