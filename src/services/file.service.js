import File from '../models/File.js';
import Patient from '../models/Patient.js';
import MedicalRecord from '../models/MedicalRecord.js';
import { ApiError } from '../utils/index.js';
import { updateTenantUsage } from '../middlewares/tenant.middleware.js';
import { generateFileName } from '../config/upload.js';
import sharp from 'sharp';
import crypto from 'crypto';

/**
 * Upload a file
 */
export const uploadFile = async (fileData, metadata, userId, tenantId) => {
    const { buffer, originalname, mimetype, size } = fileData;
    
    // Verify patient exists
    const patient = await Patient.findOne({ 
        _id: metadata.patientId, 
        tenantId: tenantId,
        isDeleted: false 
    });
    
    if (!patient) {
        throw ApiError.notFound('Patient not found');
    }
    
    // Verify record exists if provided
    if (metadata.recordId) {
        const record = await MedicalRecord.findOne({ 
            _id: metadata.recordId, 
            tenantId: tenantId,
            isDeleted: false 
        });
        if (!record) {
            throw ApiError.notFound('Medical record not found');
        }
    }
    
  // Generate file hash for integrity
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Generate unique filename
    const fileName = generateFileName(originalname, mimetype);
    
    // Todo Upload to cloud storage (AWS S3, Cloudflare R2, etc.)
    // For now, we'll store in memory (in production, upload to cloud)
    const fileUrl = `/uploads/${fileName}`; // Placeholder
    
    // Process image if it's an image (create thumbnails)
    let imageMetadata = null;
    let thumbnails = [];
    
    if (mimetype.startsWith('image/') && mimetype !== 'application/dicom') {
        try {
            const image = sharp(buffer);
            const metadata = await image.metadata();
            
            imageMetadata = {
                width: metadata.width,
                height: metadata.height,
                colorSpace: metadata.space,
                compression: metadata.compression
        };
        
        // Create thumbnails
        const thumbnailSizes = [
            { name: 'small', width: 150, height: 150 },
            { name: 'medium', width: 300, height: 300 },
            { name: 'large', width: 600, height: 600 }
        ];
        
        for (const size of thumbnailSizes) {
            const thumbnailBuffer = await image
            .resize(size.width, size.height, { fit: 'inside' })
            .toBuffer();
            
            const thumbnailName = `thumb-${size.name}-${fileName}`;
            // TODO: Upload thumbnail to cloud storage
                thumbnails.push({
                size: size.name,
                url: `/uploads/${thumbnailName}`,
                width: size.width,
                height: size.height
                });
            }
        } catch (error) {
            console.error('Image processing error:', error);
        }
    }
    
    // Create file record in database
    const file = await File.create({
        fileName: fileName,
        originalName: originalname,
        fileType: metadata.fileType || 'document',
        mimeType: mimetype,
        fileSize: size,
        storageProvider: 'local', // Will change to cloud in production
        storagePath: `/uploads/${fileName}`,
        url: fileUrl,
        fileHash: fileHash,
        patientId: metadata.patientId,
        recordId: metadata.recordId,
        category: metadata.category || 'document',
        tags: metadata.tags || [],
        description: metadata.description,
        imageMetadata: imageMetadata,
        thumbnails: thumbnails,
        createdBy: userId,
        tenantId: tenantId
    });
    
  // Update tenant storage usage
  const storageMB = size / (1024 * 1024);
    await updateTenantUsage(tenantId, { storageMB: storageMB });
    
    return file;
};

/**
 * Get file by ID
 */
export const getFileById = async (fileId, tenantId) => {
    const file = await File.findOne({ 
        _id: fileId, 
        tenantId: tenantId,
        isDeleted: false 
    })
        .populate('patientId', 'firstName lastName hospitalId')
        .populate('recordId', 'title type');
    
    if (!file) {
        throw ApiError.notFound('File not found');
    }
    
    return file;
};

/**
 * Get patient's files
 */
export const getPatientFiles = async (patientId, tenantId, filters = {}, page = 1, limit = 10) => {
    // Verify patient exists
    const patient = await Patient.findOne({ 
        _id: patientId, 
        tenantId: tenantId,
        isDeleted: false 
    });
    
    if (!patient) {
        throw ApiError.notFound('Patient not found');
    }
    
  const skip = (page - 1) * limit;
    
    // Build query
    const query = { 
        patientId: patientId, 
        tenantId: tenantId,
        isDeleted: false 
    };
    
    if (filters.category) {
        query.category = filters.category;
    }
    
    if (filters.fileType) {
        query.fileType = filters.fileType;
    }
    
    if (filters.search) {
        query.$or = [
        { originalName: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } }
        ];
    }
    
    const [files, total] = await Promise.all([
        File.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('recordId', 'title type'),
        File.countDocuments(query)
    ]);
    
    return {
        patient: {
        id: patient._id,
        name: patient.fullName
        },
        files,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    };
};

/**
 * Get files by record
 */
export const getRecordFiles = async (recordId, tenantId, page = 1, limit = 10) => {
  // Verify record exists
    const record = await MedicalRecord.findOne({ 
        _id: recordId, 
        tenantId: tenantId,
        isDeleted: false 
    });
    
    if (!record) {
        throw ApiError.notFound('Medical record not found');
    }
    
    const skip = (page - 1) * limit;
    
    const query = { 
        recordId: recordId, 
        tenantId: tenantId,
        isDeleted: false 
    };
    
    const [files, total] = await Promise.all([
        File.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
        File.countDocuments(query)
    ]);
    
    return {
        record: {
        id: record._id,
        title: record.title,
        type: record.type
        },
        files,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Delete file
 */
export const deleteFile = async (fileId, tenantId, userId) => {
    const file = await getFileById(fileId, tenantId);
    
    // TODO: Delete from cloud storage
    
    // Soft delete
    file.isDeleted = true;
    file.updatedBy = userId;
    await file.save();
    
    return file;
};

/**
 * Record file download
 */
export const recordDownload = async (fileId, tenantId, userId) => {
    const file = await getFileById(fileId, tenantId);
    
    file.downloadCount += 1;
    file.lastDownloadedAt = new Date();
    file.lastDownloadedBy = userId;
    await file.save();
    
    return file;
};

/**
 * Get file statistics
 */
export const getFileStats = async (tenantId) => {
    const stats = await File.aggregate([
        { $match: { tenantId: tenantId, isDeleted: false } },
        {
        $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalSize: { $sum: '$fileSize' }
        }
        }
    ]);
    
    const totalFiles = await File.countDocuments({ tenantId: tenantId, isDeleted: false });
    const totalSize = await File.aggregate([
        { $match: { tenantId: tenantId, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$fileSize' } } }
    ]);
    
    return {
        totalFiles,
        totalSizeMB: (totalSize[0]?.total || 0) / (1024 * 1024),
        byCategory: stats.reduce((acc, curr) => {
        acc[curr._id] = {
            count: curr.count,
            sizeMB: curr.totalSize / (1024 * 1024)
        };
        return acc;
        }, {})
    };
};