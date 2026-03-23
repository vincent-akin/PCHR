import Notification from '../models/Notification.js';
import { ApiError } from '../utils/index.js';

/**
 * Create a notification
 */
export const createNotification = async (data) => {
    const notification = await Notification.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        tenantId: data.tenantId,
        createdBy: data.createdBy
    });
    
    return notification;
};

/**
 * Create notifications for multiple users
 */
export const createBulkNotifications = async (users, notificationData) => {
    const notifications = users.map(user => ({
        userId: user._id,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        tenantId: user.tenantId,
        createdBy: notificationData.createdBy
    }));
    
    const created = await Notification.insertMany(notifications);
    return created;
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId, tenantId, filters = {}, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    
    const query = {
        userId,
        tenantId,
        expiresAt: { $gt: new Date() }
    };
    
    if (filters.read !== undefined) {
        query.read = filters.read === 'true';
    }
    
    if (filters.type) {
        query.type = filters.type;
    }
    
    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
        Notification.countDocuments(query),
        Notification.countDocuments({ userId, tenantId, read: false })
    ]);
    
    return {
        notifications,
        unreadCount,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true, readAt: new Date() },
        { new: true }
    );
    
    if (!notification) {
        throw ApiError.notFound('Notification not found');
    }
    
    return notification;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId, tenantId) => {
    await Notification.updateMany(
        { userId, tenantId, read: false },
        { read: true, readAt: new Date() }
    );
    
    return { success: true };
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId, userId) => {
    const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });
    
    if (!notification) {
        throw ApiError.notFound('Notification not found');
    }
    
    return notification;
};

/**
 * Delete old notifications (cleanup)
 */
export const cleanupOldNotifications = async () => {
    const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
    });
    
    return result;
};