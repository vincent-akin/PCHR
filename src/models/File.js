import mongoose from 'mongoose';
import createBaseSchema from './base.model.js';

export const FileTypes = {
    IMAGE: 'image',
    PDF: 'pdf',
    DICOM: 'dicom', // Medical imaging format
    DOCUMENT: 'document',
    LAB_REPORT: 'lab_report',
    PRESCRIPTION: 'prescription',
    SCAN: 'scan'
};

const fileSchemaFields = {
    // Core fields
    fileName: {
        type: String,
        required: true,
        trim: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
  
    // Storage information
    storageProvider: {
        type: String,
        enum: ['aws_s3', 'cloudflare_r2', 'azure_blob', 'local'],
        required: true
    },
    storagePath: {
        type: String,
        required: true
    },
    bucketName: String,
    region: String,
    url: {
        type: String,
        required: true
    },
    
    // File metadata
    fileHash: {
        type: String, // For integrity verification
        required: true
    },
    checksum: String,
    version: {
        type: Number,
        default: 1
    },
    
    // Relationships
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    recordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalRecord',
        index: true
    },
    
    // File categorization
    category: {
        type: String,
        enum: Object.values(FileTypes),
        required: true
    },
    tags: [String],
    description: String,
    
    // DICOM specific fields (if applicable)
    dicomMetadata: {
        studyInstanceUID: String,
        seriesInstanceUID: String,
        sopInstanceUID: String,
        modality: String,
        studyDate: Date,
        studyDescription: String,
        seriesDescription: String,
        bodyPart: String,
        patientPosition: String,
        manufacturer: String
    },
    
    // Image specific fields
    imageMetadata: {
        width: Number,
        height: Number,
        colorSpace: String,
        compression: String
    },
    
    // Access control
    isPublic: {
        type: Boolean,
        default: false
    },
    accessExpiry: Date,
    accessPin: String,
    
    // Status
    isProcessed: {
        type: Boolean,
        default: false
    },
    processingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'completed'
    },
    processingError: String,
    
    // Thumbnails (for images)
    thumbnails: [{
        size: String, // e.g., 'small', 'medium', 'large'
        url: String,
        width: Number,
        height: Number
    }],
    
    // Downloads tracking
    downloadCount: {
        type: Number,
        default: 0
    },
    lastDownloadedAt: Date,
    lastDownloadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
};

const fileSchema = createBaseSchema(fileSchemaFields, {
    indexes: [
        { patientId: 1, category: 1 },
        { recordId: 1 },
        { fileHash: 1 },
        { 'dicomMetadata.studyInstanceUID': 1 },
        { tags: 1 },
        { createdAt: -1 }
    ]
});

// Generate pre-signed URL for secure access
fileSchema.methods.generateAccessUrl = function(expiresIn = 3600) {
    // This would integrate with your cloud storage SDK
    // For now, return the stored URL
    return this.url;
};

// Increment download count
fileSchema.methods.recordDownload = async function(userId) {
    this.downloadCount += 1;
    this.lastDownloadedAt = new Date();
    this.lastDownloadedBy = userId;
    return this.save();
};

const File = mongoose.model('File', fileSchema);

export default File;