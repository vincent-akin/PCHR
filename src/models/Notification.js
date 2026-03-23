import mongoose from 'mongoose';
import createBaseSchema from './base.model.js';

export const NotificationTypes = {
    EMAIL: 'email',
    SMS: 'sms',
    IN_APP: 'in_app'
};

export const NotificationChannels = {
    TRANSFER_REQUESTED: 'transfer_requested',
    TRANSFER_APPROVED: 'transfer_approved',
    TRANSFER_REJECTED: 'transfer_rejected',
    TRANSFER_COMPLETED: 'transfer_completed',
    RECORD_CREATED: 'record_created',
    RECORD_UPDATED: 'record_updated',
    PATIENT_CREATED: 'patient_created',
    PATIENT_UPDATED: 'patient_updated',
    FILE_UPLOADED: 'file_uploaded',
    APPOINTMENT_REMINDER: 'appointment_reminder',
    SYSTEM_ALERT: 'system_alert'
};

export const NotificationStatus = {
    PENDING: 'pending',
    SENT: 'sent',
    FAILED: 'failed',
    READ: 'read'
};

const notificationSchemaFields = {
    // Recipient
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userEmail: String,
    userPhone: String,
    
    // Notification details
    type: {
        type: String,
        enum: Object.values(NotificationTypes),
        required: true
    },
    channel: {
        type: String,
        enum: Object.values(NotificationChannels),
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    
    // Action link
    actionLink: String,
    actionText: String,
    
    // Metadata
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    
    // Status tracking
    status: {
        type: String,
        enum: Object.values(NotificationStatus),
        default: NotificationStatus.PENDING,
        index: true
    },
    
    // Read status (for in-app)
    readAt: Date,
    readBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Delivery tracking
    sentAt: Date,
    deliveredAt: Date,
    failedAt: Date,
    failureReason: String,
    
    // Retry tracking
    retryCount: {
        type: Number,
        default: 0
    },
    maxRetries: {
        type: Number,
        default: 3
    },
    
    // Expiry
    expiresAt: Date,
    
    // Priority
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    }
};

const notificationSchema = createBaseSchema(notificationSchemaFields, {
    indexes: [
        { userId: 1, status: 1, createdAt: -1 },
        { channel: 1, status: 1 },
        { expiresAt: 1 },
        { priority: 1 }
    ]
});

// Mark as read
notificationSchema.methods.markAsRead = async function(userId) {
    this.status = NotificationStatus.READ;
    this.readAt = new Date();
    this.readBy = userId;
    return this.save();
};

// Mark as sent
notificationSchema.methods.markAsSent = async function() {
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
    this.deliveredAt = new Date();
    return this.save();
};

// Mark as failed
notificationSchema.methods.markAsFailed = async function(reason) {
    this.status = NotificationStatus.FAILED;
    this.failedAt = new Date();
    this.failureReason = reason;
    this.retryCount += 1;
    return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;