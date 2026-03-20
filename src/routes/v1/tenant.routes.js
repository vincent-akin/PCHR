import express from 'express';
import * as tenantController from '../../controllers/tenant.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { setTenantContext, validateTenant } from '../../middlewares/tenant.middleware.js';

const router = express.Router();

// All tenant routes require authentication
router.use(authenticate);
router.use(setTenantContext);
router.use(validateTenant);

/**
 * @route GET /api/v1/tenants/me
 * @desc Get current tenant info
 * @access Private
 */
router.get('/me', tenantController.getCurrentTenant);

/**
 * @route GET /api/v1/tenants/me/usage
 * @desc Get current tenant usage statistics
 * @access Private
 */
router.get('/me/usage', tenantController.getTenantUsage);

/**
 * @route POST /api/v1/tenants
 * @desc Create new tenant (Admin only)
 * @access Private/Admin
 */
router.post('/', authorize('admin'), tenantController.createTenant);

/**
 * @route GET /api/v1/tenants
 * @desc List all tenants (Admin only)
 * @access Private/Admin
 */
router.get('/', authorize('admin'), tenantController.listTenants);

/**
 * @route GET /api/v1/tenants/:id
 * @desc Get tenant by ID
 * @access Private (Admin or own tenant)
 */
router.get('/:id', tenantController.getTenantById);

/**
 * @route PUT /api/v1/tenants/:id
 * @desc Update tenant
 * @access Private (Admin or own tenant)
 */
router.put('/:id', tenantController.updateTenant);

/**
 * @route POST /api/v1/tenants/:id/activate
 * @desc Activate tenant (Admin only)
 * @access Private/Admin
 */
router.post('/:id/activate', authorize('admin'), tenantController.activateTenant);

/**
 * @route POST /api/v1/tenants/:id/suspend
 * @desc Suspend tenant (Admin only)
 * @access Private/Admin
 */
router.post('/:id/suspend', authorize('admin'), tenantController.suspendTenant);

export default router;