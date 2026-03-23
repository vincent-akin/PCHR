import Transfer from '../models/Transfer.js';
import Patient from '../models/Patient.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Tenant from '../models/Tenant.js';
import { ApiError } from '../utils/index.js';
import { updateTenantUsage } from '../middlewares/tenant.middleware.js';
import { TransferStatus, TransferTypes } from '../models/Transfer.js';

/**
 * Create a transfer request
 */
export const createTransfer = async (transferData, userId, tenantId) => {
    // Verify patient exists and belongs to source tenant
    const patient = await Patient.findOne({ 
        _id: transferData.patientId, 
        tenantId: tenantId,
        isDeleted: false 
    });
    
    if (!patient) {
        throw ApiError.notFound('Patient not found');
    }
    
    // Verify destination tenant exists and is active
    const destTenant = await Tenant.findById(transferData.toTenant);
    if (!destTenant) {
        throw ApiError.notFound('Destination institution not found');
    }
    
    if (destTenant.status !== 'active') {
        throw ApiError.forbidden('Destination institution is not active');
    }
    
    // Verify source tenant (current tenant) is active
    const sourceTenant = await Tenant.findById(tenantId);
    if (sourceTenant.status !== 'active') {
        throw ApiError.forbidden('Your institution is not active');
    }
    
    // Check if patient consent is obtained
    if (!transferData.patientConsent?.obtained) {
        throw ApiError.badRequest('Patient consent is required for transfer');
    }
    
    // Create transfer request
    const transfer = await Transfer.create({
        ...transferData,
        fromTenant: tenantId,
        requestedBy: userId,
        tenantId: tenantId // Base schema requirement
    });
    
    // Update tenant usage
    await updateTenantUsage(tenantId, { transfers: 1 });
    
    return transfer;
};

/**
 * Get transfer by ID
 */
export const getTransferById = async (transferId, tenantId, userRole) => {
    const transfer = await Transfer.findOne({ 
        _id: transferId,
        isDeleted: false 
    })
        .populate('patientId', 'firstName lastName hospitalId')
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email')
        .populate('rejectedBy', 'name email')
        .populate('completedBy', 'name email');
    
    if (!transfer) {
        throw ApiError.notFound('Transfer not found');
    }
    
    // Check authorization
    if (userRole !== 'admin' && 
        transfer.fromTenant.toString() !== tenantId && 
        transfer.toTenant.toString() !== tenantId) {
        throw ApiError.forbidden('You are not authorized to view this transfer');
    }
    
    return transfer;
};

/**
 * List transfers with filters
 */
export const listTransfers = async (tenantId, userRole, filters = {}, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    
    // Build query based on user role and filters
    const query = { isDeleted: false };
    
    if (userRole !== 'admin') {
        query.$or = [
        { fromTenant: tenantId },
        { toTenant: tenantId }
        ];
    }
    
    // Apply filters
    if (filters.status) {
        query.status = filters.status;
    }
    
    if (filters.patientId) {
        query.patientId = filters.patientId;
    }
    
    if (filters.fromTenant) {
        query.fromTenant = filters.fromTenant;
    }
    
    if (filters.toTenant) {
        query.toTenant = filters.toTenant;
    }
    
    if (filters.fromDate || filters.toDate) {
        query.createdAt = {};
        if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
        if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate);
    }
    
    const [transfers, total] = await Promise.all([
        Transfer.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('patientId', 'firstName lastName hospitalId')
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email'),
        Transfer.countDocuments(query)
    ]);
    
    return {
        transfers,
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
 * Approve transfer (for destination tenant)
 */
export const approveTransfer = async (transferId, tenantId, userId, notes) => {
    const transfer = await Transfer.findById(transferId);
    
    if (!transfer) {
        throw ApiError.notFound('Transfer not found');
    }
    
    // Check if destination tenant is approving
    if (transfer.toTenant.toString() !== tenantId) {
        throw ApiError.forbidden('Only the destination institution can approve this transfer');
    }
    
    // Check if transfer is pending
    if (transfer.status !== TransferStatus.PENDING) {
        throw ApiError.badRequest(`Cannot approve transfer in ${transfer.status} status`);
    }
    
    // Check if expired
    if (transfer.isExpired()) {
        transfer.status = TransferStatus.EXPIRED;
        await transfer.save();
        throw ApiError.badRequest('Transfer request has expired');
    }
    
    // Approve transfer
    transfer.status = TransferStatus.APPROVED;
    transfer.approvedBy = userId;
    transfer.approvedAt = new Date();
    transfer.approvalNotes = notes;
    
    await transfer.save();
    
    return transfer;
};

/**
 * Reject transfer
 */
export const rejectTransfer = async (transferId, tenantId, userId, reason) => {
    const transfer = await Transfer.findById(transferId);
    
    if (!transfer) {
        throw ApiError.notFound('Transfer not found');
    }
    
    // Check if either source or destination tenant is rejecting
    if (transfer.fromTenant.toString() !== tenantId && 
        transfer.toTenant.toString() !== tenantId) {
        throw ApiError.forbidden('You are not authorized to reject this transfer');
    }
    
    // Check if transfer is pending
    if (transfer.status !== TransferStatus.PENDING) {
        throw ApiError.badRequest(`Cannot reject transfer in ${transfer.status} status`);
    }
    
    // Reject transfer
    transfer.status = TransferStatus.REJECTED;
    transfer.rejectedBy = userId;
    transfer.rejectedAt = new Date();
    transfer.rejectionReason = reason;
    
    await transfer.save();
    
    return transfer;
};

/**
 * Complete transfer (transfer records after approval)
 */
export const completeTransfer = async (transferId, tenantId, userId) => {
    const transfer = await Transfer.findById(transferId)
        .populate('patientId');
    
    if (!transfer) {
        throw ApiError.notFound('Transfer not found');
    }
    
    // Check if source tenant is completing
    if (transfer.fromTenant.toString() !== tenantId) {
        throw ApiError.forbidden('Only the source institution can complete the transfer');
    }
    
    // Check if transfer is approved
    if (transfer.status !== TransferStatus.APPROVED) {
        throw ApiError.badRequest(`Cannot complete transfer in ${transfer.status} status`);
    }
    
    // Get records to transfer
    let records = [];
    
    if (transfer.type === TransferTypes.FULL_RECORD) {
        // Get all records for the patient
        records = await MedicalRecord.find({ 
        patientId: transfer.patientId._id,
        isDeleted: false 
        }).lean();
    } else if (transfer.type === TransferTypes.SELECTED_RECORDS) {
        // Get only selected records
        const selectedIds = transfer.selectedRecords
            .filter(r => r.included)
            .map(r => r.recordId);
        
        records = await MedicalRecord.find({ 
            _id: { $in: selectedIds },
            isDeleted: false 
        }).lean();
    }
    
  // todo: Transfer records to destination tenant
  // This would involve:
  // 1. Create copies of records in destination tenant's database
  // 2. Generate transfer report
  // 3. Create audit trail in destination tenant
    
    // Mark transfer as completed
    transfer.status = TransferStatus.COMPLETED;
    transfer.completedBy = userId;
    transfer.completedAt = new Date();
    
    await transfer.save();
    
    return {
        transfer,
        recordsTransferred: records.length,
        records
    };
};

/**
 * Cancel transfer
 */
export const cancelTransfer = async (transferId, tenantId, userId) => {
    const transfer = await Transfer.findById(transferId);
    
    if (!transfer) {
        throw ApiError.notFound('Transfer not found');
    }
    
    // Check if source tenant is cancelling
    if (transfer.fromTenant.toString() !== tenantId) {
        throw ApiError.forbidden('Only the source institution can cancel this transfer');
    }
    
    // Check if transfer is pending or approved
    if (transfer.status !== TransferStatus.PENDING && 
        transfer.status !== TransferStatus.APPROVED) {
        throw ApiError.badRequest(`Cannot cancel transfer in ${transfer.status} status`);
    }
    
  // Cancel transfer
    transfer.status = TransferStatus.CANCELLED;
    await transfer.save();
    
    return transfer;
};

/**
 * Get transfer statistics
 */
export const getTransferStats = async (tenantId) => {
    const matchStage = {
        $or: [
            { fromTenant: tenantId },
            { toTenant: tenantId }
        ],
        isDeleted: false
    };
    
    const stats = await Transfer.aggregate([
        { $match: matchStage },
        {
        $group: {
            _id: '$status',
            count: { $sum: 1 }
        }
        }
    ]);
    
  // Get monthly trend
    const monthlyTrend = await Transfer.aggregate([
        { $match: matchStage },
        {
        $group: {
            _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
        }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
    ]);
    
    // Get average processing time (from request to completion)
    const avgProcessingTime = await Transfer.aggregate([
        { 
            $match: { 
                ...matchStage,
                status: TransferStatus.COMPLETED,
                completedAt: { $exists: true }
            } 
        },
        {
            $project: {
                processingTime: {
                $subtract: ['$completedAt', '$requestedAt']
                }
            }
        },
        {
            $group: {
                _id: null,
                avgTimeMs: { $avg: '$processingTime' }
            }
        }
    ]);
    
    const statsMap = stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});
    
    return {
        pending: statsMap.pending || 0,
        approved: statsMap.approved || 0,
        rejected: statsMap.rejected || 0,
        completed: statsMap.completed || 0,
        cancelled: statsMap.cancelled || 0,
        expired: statsMap.expired || 0,
        total: Object.values(statsMap).reduce((a, b) => a + b, 0),
        monthlyTrend: monthlyTrend.map(item => ({
        month: `${item._id.year}-${item._id.month}`,
        count: item.count
        })),
        avgProcessingTimeHours: avgProcessingTime[0] 
        ? Math.round(avgProcessingTime[0].avgTimeMs / (1000 * 60 * 60) * 10) / 10 
        : 0
    };
};

/**
 * Get pending transfers for destination tenant
 */
export const getPendingTransfers = async (tenantId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    
    const query = {
        toTenant: tenantId,
        status: TransferStatus.PENDING,
        isDeleted: false,
        expiresAt: { $gt: new Date() }
    };
    
    const [transfers, total] = await Promise.all([
        Transfer.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: 1 })
        .populate('patientId', 'firstName lastName hospitalId')
        .populate('requestedBy', 'name email'),
        Transfer.countDocuments(query)
    ]);
    
    return {
        transfers,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};