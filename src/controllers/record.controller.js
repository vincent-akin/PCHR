import * as recordService from '../services/record.service.js';
import { asyncHandler, ApiResponse, ApiError } from '../utils/index.js';
import AuditLog from '../models/AuditLog.js';
import { AuditActions } from '../models/AuditLog.js';

/**
 * Create a new medical record
 * POST /api/v1/records
 */
export const createRecord = asyncHandler(async (req, res) => {
    const record = await recordService.createRecord(
        req.body,
        req.user.userId,
        req.user.tenantId
    );
    
  // Log record creation
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.RECORD_CREATED,
        resourceType: 'record',
        resourceId: record._id,
        resourceName: record.title,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Medical record created: ${record.title}`,
        metadata: { type: record.type, patientId: record.patientId }
    });
    
    return ApiResponse.created(record, 'Medical record created successfully').send(res);
});

/**
 * Get record by ID
 * GET /api/v1/records/:id
 */
export const getRecordById = asyncHandler(async (req, res) => {
    const record = await recordService.getRecordById(
        req.params.id,
        req.user.tenantId
    );
    
  // Log record view
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.RECORD_VIEWED,
        resourceType: 'record',
        resourceId: record._id,
        resourceName: record.title,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Medical record viewed: ${record.title}`
    });
    
    return ApiResponse.success(record, 'Medical record retrieved successfully').send(res);
});

/**
 * Get patient's medical records
 * GET /api/v1/records/patient/:patientId
 */
export const getPatientRecords = asyncHandler(async (req, res) => {
    const { page, limit, type, status, fromDate, toDate, search } = req.query;
    
    const result = await recordService.getPatientRecords(
        req.params.patientId,
        req.user.tenantId,
        { type, status, fromDate, toDate, search },
        parseInt(page) || 1,
        parseInt(limit) || 10
    );
    
    return ApiResponse.success(result, 'Patient records retrieved successfully').send(res);
});

/**
 * Update medical record
 * PUT /api/v1/records/:id
 */
export const updateRecord = asyncHandler(async (req, res) => {
    const record = await recordService.updateRecord(
        req.params.id,
        req.body,
        req.user.tenantId,
        req.user.userId
    );
    
    // Log record update
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.RECORD_UPDATED,
        resourceType: 'record',
        resourceId: record._id,
        resourceName: record.title,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Medical record updated: ${record.title}`,
        metadata: { changes: Object.keys(req.body) }
    });
    
    return ApiResponse.success(record, 'Medical record updated successfully').send(res);
});

/**
 * Delete medical record (soft delete - admin only)
 * DELETE /api/v1/records/:id
 */
export const deleteRecord = asyncHandler(async (req, res) => {
    const record = await recordService.deleteRecord(
        req.params.id,
        req.user.tenantId,
        req.user.userId
    );
    
    // Log record deletion
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.RECORD_DELETED,
        resourceType: 'record',
        resourceId: record._id,
        resourceName: record.title,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Medical record deleted: ${record.title}`
    });
    
    return ApiResponse.success(null, 'Medical record deleted successfully').send(res);
});

/**
 * Get records by type
 * GET /api/v1/records/type/:type
 */
export const getRecordsByType = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    
    const result = await recordService.getRecordsByType(
        req.user.tenantId,
        req.params.type,
        parseInt(page) || 1,
        parseInt(limit) || 10
    );
    
    return ApiResponse.success(result, 'Records retrieved successfully').send(res);
});

/**
 * Get record statistics
 * GET /api/v1/records/stats
 */
export const getRecordStats = asyncHandler(async (req, res) => {
    const { patientId } = req.query;
    
    const stats = await recordService.getRecordStats(
        req.user.tenantId,
        patientId
    );
    
    return ApiResponse.success(stats, 'Record statistics retrieved').send(res);
});