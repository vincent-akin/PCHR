import mongoose from 'mongoose';
import createBaseSchema from './base.model.js';

export const NotificationTypes = {
    TRANSFER_REQUESTED: 'transfer_requested',
    TRANSFER_APPROVED: 'transfer_approved',
    TRANSFER_REJECTED: 'transfer_rejected',
    TRANSFER_COMPLETED: 'transfer_completed',
    RECORD_CREATED: 'record_created',
    PATIENT_CREATED: 'patient_created',
    SYSTEM_ALERT: 'system_alert'
};

const notificationSchemaFields = {
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: Object.values(NotificationTypes),
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: Date,
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
};

const notificationSchema = createBaseSchema(notificationSchemaFields, {
    indexes: [
        { userId: 1, read: 1, createdAt: -1 },
        { expiresAt: 1 }
    ]
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;