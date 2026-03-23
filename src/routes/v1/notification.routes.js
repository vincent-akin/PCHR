import express from 'express';
import * as notificationController from '../../controllers/notification.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { setTenantContext, validateTenant } from '../../middlewares/tenant.middleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);
router.use(setTenantContext);
router.use(validateTenant);

/**
 * @route GET /api/v1/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/', notificationController.getUserNotifications);

/**
 * @route PUT /api/v1/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @route PUT /api/v1/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @route DELETE /api/v1/notifications/:id
 * @desc Delete notification
 * @access Private
 */
router.delete('/:id', notificationController.deleteNotification);

export default router;