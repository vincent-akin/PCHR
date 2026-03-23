import * as notificationService from '../services/notification.service.js';
import { asyncHandler, ApiResponse } from '../utils/index.js';

/**
 * Get user notifications
 * GET /api/v1/notifications
 */
export const getUserNotifications = asyncHandler(async (req, res) => {
    const { page, limit, read, type } = req.query;
    
    const result = await notificationService.getUserNotifications(
        req.user.userId,
        req.user.tenantId,
        { read, type },
        parseInt(page) || 1,
        parseInt(limit) || 20
    );
    
    return ApiResponse.success(result, 'Notifications retrieved').send(res);
});

/**
 * Mark notification as read
 * PUT /api/v1/notifications/:id/read
 */
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(
        req.params.id,
        req.user.userId
    );
    
    return ApiResponse.success(notification, 'Notification marked as read').send(res);
});

/**
 * Mark all notifications as read
 * PUT /api/v1/notifications/read-all
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user.userId, req.user.tenantId);
    return ApiResponse.success(null, 'All notifications marked as read').send(res);
});

/**
 * Delete notification
 * DELETE /api/v1/notifications/:id
 */
export const deleteNotification = asyncHandler(async (req, res) => {
    await notificationService.deleteNotification(req.params.id, req.user.userId);
    return ApiResponse.success(null, 'Notification deleted').send(res);
});