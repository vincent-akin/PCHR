import * as fileService from '../services/file.service.js';
import { asyncHandler, ApiResponse } from '../utils/index.js';
import AuditLog from '../models/AuditLog.js';
import { AuditActions } from '../models/AuditLog.js';
import { upload } from '../config/upload.js';

/**
 * Upload file
 * POST /api/v1/files/upload
 */
export const uploadFile = [
    upload.single('file'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw ApiError.badRequest('No file uploaded');
        }
        
        const file = await fileService.uploadFile(
            req.file,
            req.body,
            req.user.userId,
            req.user.tenantId
        );
        
        // Log file upload
        await AuditLog.log({
            userId: req.user.userId,
            userRole: req.user.role,
            userEmail: req.user.email,
            userName: req.user.name,
            action: AuditActions.FILE_UPLOADED,
            resourceType: 'file',
            resourceId: file._id,
            resourceName: file.originalName,
            tenantId: req.user.tenantId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            description: `File uploaded: ${file.originalName}`,
            metadata: {
                category: file.category,
                size: file.fileSize,
                mimeType: file.mimeType
        }
        });
        
        return ApiResponse.created(file, 'File uploaded successfully').send(res);
    })
];

/**
 * Get file by ID
 * GET /api/v1/files/:id
 */
export const getFileById = asyncHandler(async (req, res) => {
    const file = await fileService.getFileById(
        req.params.id,
        req.user.tenantId
    );
    
    // Record view
    await fileService.recordDownload(req.params.id, req.user.tenantId, req.user.userId);
    
    // Log file view
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.FILE_VIEWED,
        resourceType: 'file',
        resourceId: file._id,
        resourceName: file.originalName,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `File viewed: ${file.originalName}`
    });
    
    return ApiResponse.success(file, 'File retrieved successfully').send(res);
});

/**
 * Download file
 * GET /api/v1/files/:id/download
 */
export const downloadFile = asyncHandler(async (req, res) => {
    const file = await fileService.getFileById(
        req.params.id,
        req.user.tenantId
    );
    
    // Record download
    await fileService.recordDownload(req.params.id, req.user.tenantId, req.user.userId);
    
    // Log file download
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.FILE_DOWNLOADED,
        resourceType: 'file',
        resourceId: file._id,
        resourceName: file.originalName,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `File downloaded: ${file.originalName}`
    });
    
  // todo: Stream file from cloud storage
    // For now, return file metadata
    return ApiResponse.success({
        url: file.url,
        fileName: file.originalName,
        size: file.fileSize,
        mimeType: file.mimeType
    }, 'File ready for download').send(res);
});

/**
 * Get patient's files
 * GET /api/v1/files/patient/:patientId
 */
export const getPatientFiles = asyncHandler(async (req, res) => {
    const { page, limit, category, fileType, search } = req.query;
    
    const result = await fileService.getPatientFiles(
        req.params.patientId,
        req.user.tenantId,
        { category, fileType, search },
        parseInt(page) || 1,
        parseInt(limit) || 10
    );
    
    return ApiResponse.success(result, 'Patient files retrieved').send(res);
});

/**
 * Get record's files
 * GET /api/v1/files/record/:recordId
 */
export const getRecordFiles = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    
    const result = await fileService.getRecordFiles(
        req.params.recordId,
        req.user.tenantId,
        parseInt(page) || 1,
        parseInt(limit) || 10
    );
    
    return ApiResponse.success(result, 'Record files retrieved').send(res);
});

/**
 * Delete file
 * DELETE /api/v1/files/:id
 */
export const deleteFile = asyncHandler(async (req, res) => {
    const file = await fileService.deleteFile(
        req.params.id,
        req.user.tenantId,
        req.user.userId
    );
    
    // Log file deletion
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.FILE_DELETED,
        resourceType: 'file',
        resourceId: file._id,
        resourceName: file.originalName,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `File deleted: ${file.originalName}`
    });
    
    return ApiResponse.success(null, 'File deleted successfully').send(res);
});

/**
 * Get file statistics
 * GET /api/v1/files/stats
 */
export const getFileStats = asyncHandler(async (req, res) => {
    const stats = await fileService.getFileStats(req.user.tenantId);
    return ApiResponse.success(stats, 'File statistics retrieved').send(res);
});