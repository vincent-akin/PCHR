import User from '../models/User.js';
import { createNotification, createBulkNotifications } from '../services/notification.service.js';

/**
 * Notify user about transfer request
 */
export const notifyTransferRequested = async (transfer, patient, requestedBy, toTenantId) => {
    // Find users in destination tenant who should be notified
    const users = await User.find({
        tenantId: toTenantId,
        role: { $in: ['admin', 'doctor'] },
        isActive: true
    });
    
    await createBulkNotifications(users, {
        type: 'transfer_requested',
        title: 'New Transfer Request',
        message: `Transfer request ${transfer.transferCode} for patient ${patient.fullName}`,
        data: {
            transferId: transfer._id,
            transferCode: transfer.transferCode,
            patientId: patient._id,
            patientName: patient.fullName,
            requestedBy: requestedBy.name
        },
        createdBy: requestedBy._id
    });
};

/**
 * Notify user about transfer approval
 */
export const notifyTransferApproved = async (transfer, patient, approvedBy) => {
    const users = await User.find({
        tenantId: transfer.fromTenant,
        role: { $in: ['admin', 'doctor'] },
        isActive: true
    });
    
    await createBulkNotifications(users, {
        type: 'transfer_approved',
        title: 'Transfer Approved',
        message: `Transfer request ${transfer.transferCode} for patient ${patient.fullName} has been approved`,
        data: {
            transferId: transfer._id,
            transferCode: transfer.transferCode,
            patientId: patient._id,
            patientName: patient.fullName,
            approvedBy: approvedBy.name
        },
        createdBy: approvedBy._id
    });
};

/**
 * Notify user about record creation
 */
export const notifyRecordCreated = async (record, patient, doctor) => {
    await createNotification({
        userId: doctor._id,
        type: 'record_created',
        title: 'Record Created',
        message: `Medical record "${record.title}" created for ${patient.fullName}`,
        data: {
            recordId: record._id,
            recordTitle: record.title,
            patientId: patient._id,
            patientName: patient.fullName
        },
        tenantId: doctor.tenantId,
        createdBy: doctor._id
    });
};