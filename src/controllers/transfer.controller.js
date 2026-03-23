import * as transferService from '../services/transfer.service.js';
import { asyncHandler, ApiResponse } from '../utils/index.js';
import AuditLog from '../models/AuditLog.js';
import { AuditActions } from '../models/AuditLog.js';

/**
 * Create transfer request
 * POST /api/v1/transfers
 */
export const createTransfer = asyncHandler(async (req, res) => {
    const transfer = await transferService.createTransfer(
        req.body,
        req.user.userId,
        req.user.tenantId
    );
    
    // Log transfer creation
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.TRANSFER_REQUESTED,
        resourceType: 'transfer',
        resourceId: transfer._id,
        resourceName: transfer.transferCode,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Transfer request created: ${transfer.transferCode}`,
        metadata: {
        toTenant: transfer.toTenant,
        type: transfer.type,
        patientId: transfer.patientId
        }
    });
    
    return ApiResponse.created(transfer, 'Transfer request created successfully').send(res);
    });

    /**
     * Get transfer by ID
     * GET /api/v1/transfers/:id
     */
    export const getTransferById = asyncHandler(async (req, res) => {
    const transfer = await transferService.getTransferById(
        req.params.id,
        req.user.tenantId,
        req.user.role
    );
    
    // Log transfer view
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.TRANSFER_VIEWED,
        resourceType: 'transfer',
        resourceId: transfer._id,
        resourceName: transfer.transferCode,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Transfer viewed: ${transfer.transferCode}`
    });
    
    return ApiResponse.success(transfer, 'Transfer retrieved successfully').send(res);
});

/**
 * List transfers
 * GET /api/v1/transfers
 */
export const listTransfers = asyncHandler(async (req, res) => {
    const { page, limit, status, patientId, fromTenant, toTenant, fromDate, toDate } = req.query;
    
    const result = await transferService.listTransfers(
        req.user.tenantId,
        req.user.role,
        { status, patientId, fromTenant, toTenant, fromDate, toDate },
        parseInt(page) || 1,
        parseInt(limit) || 10
    );
    
    return ApiResponse.success(result, 'Transfers retrieved successfully').send(res);
});

/**
 * Approve transfer
 * POST /api/v1/transfers/:id/approve
 */
export const approveTransfer = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    
    const transfer = await transferService.approveTransfer(
        req.params.id,
        req.user.tenantId,
        req.user.userId,
        notes
    );
    
    // Log transfer approval
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.TRANSFER_APPROVED,
        resourceType: 'transfer',
        resourceId: transfer._id,
        resourceName: transfer.transferCode,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Transfer approved: ${transfer.transferCode}`
    });
    
    return ApiResponse.success(transfer, 'Transfer approved successfully').send(res);
});

/**
 * Reject transfer
 * POST /api/v1/transfers/:id/reject
 */
export const rejectTransfer = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    
    if (!reason) {
        throw ApiError.badRequest('Rejection reason is required');
    }
    
    const transfer = await transferService.rejectTransfer(
        req.params.id,
        req.user.tenantId,
        req.user.userId,
        reason
    );
    
    // Log transfer rejection
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.TRANSFER_REJECTED,
        resourceType: 'transfer',
        resourceId: transfer._id,
        resourceName: transfer.transferCode,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Transfer rejected: ${transfer.transferCode}`,
        metadata: { reason }
    });
    
    return ApiResponse.success(transfer, 'Transfer rejected').send(res);
    });

    /**
     * Complete transfer
     * POST /api/v1/transfers/:id/complete
     */
    export const completeTransfer = asyncHandler(async (req, res) => {
    const transfer = await transferService.completeTransfer(
        req.params.id,
        req.user.tenantId,
        req.user.userId
    );
    
  // Log transfer completion
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.TRANSFER_COMPLETED,
        resourceType: 'transfer',
        resourceId: transfer.transfer._id,
        resourceName: transfer.transfer.transferCode,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Transfer completed: ${transfer.transfer.transferCode}`,
        metadata: { recordsTransferred: transfer.recordsTransferred }
    });
    
    return ApiResponse.success(transfer, 'Transfer completed successfully').send(res);
});

/**
 * Cancel transfer
 * POST /api/v1/transfers/:id/cancel
 */
export const cancelTransfer = asyncHandler(async (req, res) => {
    const transfer = await transferService.cancelTransfer(
        req.params.id,
        req.user.tenantId,
        req.user.userId
    );
    
    // Log transfer cancellation
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.TRANSFER_CANCELLED,
        resourceType: 'transfer',
        resourceId: transfer._id,
        resourceName: transfer.transferCode,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Transfer cancelled: ${transfer.transferCode}`
    });
    
    return ApiResponse.success(transfer, 'Transfer cancelled').send(res);
});

/**
 * Get transfer statistics
 * GET /api/v1/transfers/stats
 */
export const getTransferStats = asyncHandler(async (req, res) => {
    const stats = await transferService.getTransferStats(req.user.tenantId);
    return ApiResponse.success(stats, 'Transfer statistics retrieved').send(res);
});

/**
 * Get pending transfers for current tenant
 * GET /api/v1/transfers/pending
 */
export const getPendingTransfers = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    
    const result = await transferService.getPendingTransfers(
        req.user.tenantId,
        parseInt(page) || 1,
        parseInt(limit) || 10
    );
    
    return ApiResponse.success(result, 'Pending transfers retrieved').send(res);
});