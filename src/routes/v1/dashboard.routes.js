import express from 'express';
import * as dashboardController from '../../controllers/dashboard.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { setTenantContext, validateTenant } from '../../middlewares/tenant.middleware.js';

const router = express.Router();

// All dashboard routes require authentication and tenant context
router.use(authenticate);
router.use(setTenantContext);
router.use(validateTenant);

/**
 * @route GET /api/v1/dashboard/stats
 * @desc Get main dashboard statistics
 * @access Private (All authenticated users)
 */
router.get('/stats', dashboardController.getDashboardStats);

/**
 * @route GET /api/v1/dashboard/demographics
 * @desc Get patient demographics
 * @access Private (Doctor, Admin)
 */
router.get('/demographics', authorize('doctor', 'admin'), dashboardController.getPatientDemographics);

/**
 * @route GET /api/v1/dashboard/record-distribution
 * @desc Get record type distribution
 * @access Private (Doctor, Admin)
 */
router.get('/record-distribution', authorize('doctor', 'admin'), dashboardController.getRecordDistribution);

/**
 * @route GET /api/v1/dashboard/activity
 * @desc Get recent activity
 * @access Private (All authenticated users)
 */
router.get('/activity', dashboardController.getRecentActivity);

/**
 * @route GET /api/v1/dashboard/top-doctors
 * @desc Get top doctors by activity
 * @access Private (Admin only)
 */
router.get('/top-doctors', authorize('admin'), dashboardController.getTopDoctors);

/**
 * @route GET /api/v1/dashboard/trends
 * @desc Get monthly trends
 * @access Private (Doctor, Admin)
 */
router.get('/trends', authorize('doctor', 'admin'), dashboardController.getMonthlyTrends);

/**
 * @route GET /api/v1/dashboard/storage
 * @desc Get storage breakdown
 * @access Private (Doctor, Admin)
 */
router.get('/storage', authorize('doctor', 'admin'), dashboardController.getStorageBreakdown);

/**
 * @route GET /api/v1/dashboard/alerts
 * @desc Get system alerts
 * @access Private (All authenticated users)
 */
router.get('/alerts', dashboardController.getAlerts);

export default router;