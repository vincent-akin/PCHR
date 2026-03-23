import Transfer from '../models/Transfer.js';
import Patient from '../models/Patient.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import { ApiError } from '../utils/index.js';
import { updateTenantUsage } from '../middlewares/tenant.middleware.js';
import { TransferStatus, TransferTypes } from '../models/Transfer.js';
import { createNotification, createBulkNotifications } from './notification.service.js';

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
    
    // Get requester info
    const requester = await User.findById(userId);
    
    // Create transfer request
    const transfer = await Transfer.create({
        ...transferData,
        fromTenant: tenantId,
        requestedBy: userId,
        tenantId: tenantId // Base schema requirement
    });
    
    // Update tenant usage
    await updateTenantUsage(tenantId, { transfers: 1 });
    
    // 🔔 NOTIFICATION: Notify destination tenant admins and doctors
    const destinationUsers = await User.find({
        tenantId: transferData.toTenant,
        role: { $in: ['admin', 'doctor'] },
        isActive: true
    });
    
    if (destinationUsers.length > 0) {
        await createBulkNotifications(destinationUsers, {
        type: 'transfer_requested',
        title: 'New Transfer Request',
        message: `Transfer request ${transfer.transferCode} for patient ${patient.fullName} from ${sourceTenant.name}`,
        data: {
            transferId: transfer._id,
            transferCode: transfer.transferCode,
            patientId: patient._id,
            patientName: patient.fullName,
            fromTenant: sourceTenant.name,
            toTenant: destTenant.name,
            requestedBy: requester.name,
            purpose: transfer.purpose,
            requestedAt: transfer.requestedAt
        },
        createdBy: userId
        });
    }
    
    // 🔔 NOTIFICATION: Notify source tenant doctors about the request (optional)
    const sourceDoctors = await User.find({
        tenantId: tenantId,
        role: 'doctor',
        isActive: true,
        _id: { $ne: userId } // Don't notify the requester
    });
    
    if (sourceDoctors.length > 0) {
        await createBulkNotifications(sourceDoctors, {
        type: 'transfer_requested',
        title: 'Transfer Request Created',
        message: `You requested a transfer (${transfer.transferCode}) for patient ${patient.fullName} to ${destTenant.name}`,
        data: {
            transferId: transfer._id,
            transferCode: transfer.transferCode,
            patientId: patient._id,
            patientName: patient.fullName,
            toTenant: destTenant.name
        },
        createdBy: userId
        });
    }
    
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
    const transfer = await Transfer.findById(transferId)
        .populate('patientId')
        .populate('requestedBy', 'name email');
    
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
    
    // Get approver info
    const approver = await User.findById(userId);
    const sourceTenant = await Tenant.findById(transfer.fromTenant);
    const destTenant = await Tenant.findById(transfer.toTenant);
    
    // Approve transfer
    transfer.status = TransferStatus.APPROVED;
    transfer.approvedBy = userId;
    transfer.approvedAt = new Date();
    transfer.approvalNotes = notes;
    
    await transfer.save();
    
    // 🔔 NOTIFICATION: Notify source tenant admins and doctors about approval
    const sourceUsers = await User.find({
        tenantId: transfer.fromTenant,
        role: { $in: ['admin', 'doctor'] },
        isActive: true
    });
    
    if (sourceUsers.length > 0) {
        await createBulkNotifications(sourceUsers, {
        type: 'transfer_approved',
        title: 'Transfer Approved',
        message: `Transfer request ${transfer.transferCode} for patient ${transfer.patientId.fullName} has been approved by ${approver.name} from ${destTenant.name}`,
        data: {
            transferId: transfer._id,
            transferCode: transfer.transferCode,
            patientId: transfer.patientId._id,
            patientName: transfer.patientId.fullName,
            approvedBy: approver.name,
            approvalNotes: notes,
            fromTenant: sourceTenant.name,
            toTenant: destTenant.name,
            approvedAt: transfer.approvedAt
        },
        createdBy: userId
        });
    }
    
    // 🔔 NOTIFICATION: Notify the requester specifically
    await createNotification({
        userId: transfer.requestedBy._id,
        type: 'transfer_approved',
        title: 'Your Transfer Request Was Approved',
        message: `Your transfer request ${transfer.transferCode} for patient ${transfer.patientId.fullName} has been approved by ${approver.name}`,
        data: {
            transferId: transfer._id,
            transferCode: transfer.transferCode,
            patientId: transfer.patientId._id,
            patientName: transfer.patientId.fullName,
            approvedBy: approver.name,
            approvalNotes: notes
        },
        tenantId: transfer.fromTenant,
        createdBy: userId
    });
    
    return transfer;
};

/**
 * Reject transfer
 */
export const rejectTransfer = async (transferId, tenantId, userId, reason) => {
    const transfer = await Transfer.findById(transferId)
        .populate('patientId')
        .populate('requestedBy', 'name email');
    
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
    
    // Get rejecter info
    const rejecter = await User.findById(userId);
    const rejectingTenant = await Tenant.findById(tenantId);
    
    // Reject transfer
    transfer.status = TransferStatus.REJECTED;
    transfer.rejectedBy = userId;
    transfer.rejectedAt = new Date();
    transfer.rejectionReason = reason;
    
    await transfer.save();
    
    // 🔔 NOTIFICATION: Notify the requester about rejection
    await createNotification({
        userId: transfer.requestedBy._id,
        type: 'transfer_rejected',
        title: 'Transfer Request Rejected',
        message: `Your transfer request ${transfer.transferCode} for patient ${transfer.patientId.fullName} was rejected by ${rejecter.name} from ${rejectingTenant.name}. Reason: ${reason}`,
        data: {
            transferId: transfer._id,
            transferCode: transfer.transferCode,
            patientId: transfer.patientId._id,
            patientName: transfer.patientId.fullName,
            rejectedBy: rejecter.name,
            rejectionReason: reason,
            rejectingTenant: rejectingTenant.name,
            rejectedAt: transfer.rejectedAt
        },
        tenantId: transfer.fromTenant,
        createdBy: userId
    });
    
    // 🔔 NOTIFICATION: Notify other stakeholders (admins/doctors in source tenant)
    const sourceUsers = await User.find({
        tenantId: transfer.fromTenant,
        role: { $in: ['admin', 'doctor'] },
        isActive: true,
        _id: { $ne: transfer.requestedBy._id }
    });
    
    if (sourceUsers.length > 0) {
        await createBulkNotifications(sourceUsers, {
        type: 'transfer_rejected',
        title: 'Transfer Request Rejected',
        message: `Transfer request ${transfer.transferCode} for patient ${transfer.patientId.fullName} was rejected by ${rejecter.name}`,
        data: {
            transferId: transfer._id,
            transferCode: transfer.transferCode,
            patientId: transfer.patientId._id,
            patientName: transfer.patientId.fullName,
            rejectedBy: rejecter.name,
            rejectionReason: reason
        },
        createdBy: userId
        });
    }
    
    return transfer;
};

/**
 * Complete transfer (transfer records after approval)
 */
export const completeTransfer = async (transferId, tenantId, userId) => {
    const transfer = await Transfer.findById(transferId)
        .populate('patientId')
        .populate('requestedBy', 'name email');
    
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
    let recordsCount = 0;
    
    if (transfer.type === TransferTypes.FULL_RECORD) {
        records = await MedicalRecord.find({ 
        patientId: transfer.patientId._id,
        isDeleted: false 
        }).lean();
        recordsCount = records.length;
    } else if (transfer.type === TransferTypes.SELECTED_RECORDS) {
        const selectedIds = transfer.selectedRecords
        .filter(r => r.included)
        .map(r => r.recordId);
        records = await MedicalRecord.find({ 
        _id: { $in: selectedIds },
        isDeleted: false 
        }).lean();
        recordsCount = records.length;
    }
    
    // Get completer info
    const completer = await User.findById(userId);
    const sourceTenant = await Tenant.findById(transfer.fromTenant);
    const destTenant = await Tenant.findById(transfer.toTenant);
    
    // Mark transfer as completed
    transfer.status = TransferStatus.COMPLETED;
    transfer.completedBy = userId;
    transfer.completedAt = new Date();
    
    await transfer.save();
    
    // 🔔 NOTIFICATION: Notify destination tenant about completion
    const destUsers = await User.find({
        tenantId: transfer.toTenant,
        role: { $in: ['admin', 'doctor'] },
        isActive: true
    });
    
    if (destUsers.length > 0) {
        await createBulkNotifications(destUsers, {
        type: 'transfer_completed',
        title: 'Transfer Completed',
        message: `Transfer ${transfer.transferCode} for patient ${transfer.patientId.fullName} has been completed. ${recordsCount} records transferred.`,
        data: {
            transferId: transfer._id,
            transferCode: transfer.transferCode,
            patientId: transfer.patientId._id,
            patientName: transfer.patientId.fullName,
            recordsCount: recordsCount,
            completedBy: completer.name,
            fromTenant: sourceTenant.name,
            completedAt: transfer.completedAt
        },
        createdBy: userId
        });
    }
    
    // 🔔 NOTIFICATION: Notify the requester
    await createNotification({
        userId: transfer.requestedBy._id,
        type: 'transfer_completed',
        title: 'Transfer Completed Successfully',
        message: `Your transfer request ${transfer.transferCode} for patient ${transfer.patientId.fullName} has been completed. ${recordsCount} records were transferred.`,
        data: {
            transferId: transfer._id,
            transferCode: transfer.transferCode,
            patientId: transfer.patientId._id,
            patientName: transfer.patientId.fullName,
            recordsCount: recordsCount,
            completedAt: transfer.completedAt
        },
        tenantId: transfer.fromTenant,
        createdBy: userId
    });
    
    return {
        transfer,
        recordsTransferred: recordsCount,
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
    
    // Get canceller info
    const canceller = await User.findById(userId);
    
    // Cancel transfer
    transfer.status = TransferStatus.CANCELLED;
    await transfer.save();
    
    // 🔔 NOTIFICATION: Notify destination tenant about cancellation
    const destUsers = await User.find({
        tenantId: transfer.toTenant,
        role: { $in: ['admin', 'doctor'] },
        isActive: true
    });
    
    if (destUsers.length > 0) {
        await createBulkNotifications(destUsers, {
        type: 'transfer_cancelled',
        title: 'Transfer Cancelled',
        message: `Transfer request ${transfer.transferCode} has been cancelled by ${canceller.name}`,
        data: {
            transferId: transfer._id,
            transferCode: transfer.transferCode,
            cancelledBy: canceller.name
        },
        createdBy: userId
        });
    }
    
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