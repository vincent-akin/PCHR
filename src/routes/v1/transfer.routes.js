import express from 'express';
import * as transferController from '../../controllers/transfer.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { setTenantContext, validateTenant } from '../../middlewares/tenant.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { 
    createTransferSchema,
    approveTransferSchema,
    rejectTransferSchema,
    transferIdSchema,
    listTransfersSchema
} from '../../validators/transfer.validator.js';

const router = express.Router();

// All transfer routes require authentication and tenant context
router.use(authenticate);
router.use(setTenantContext);
router.use(validateTenant);

/**
 * @route POST /api/v1/transfers
 * @desc Create a transfer request
 * @access Private (Doctor, Admin)
 */
router.post(
    '/',
    authorize('doctor', 'admin'),
    validate(createTransferSchema),
    transferController.createTransfer
);

/**
 * @route GET /api/v1/transfers
 * @desc List transfers with filters
 * @access Private (All authenticated users)
 */
router.get(
    '/',
    validate(listTransfersSchema, 'query'),
    transferController.listTransfers
);

/**
 * @route GET /api/v1/transfers/stats
 * @desc Get transfer statistics
 * @access Private (Doctor, Admin)
 */
router.get(
    '/stats',
    authorize('doctor', 'admin'),
    transferController.getTransferStats
);

/**
 * @route GET /api/v1/transfers/pending
 * @desc Get pending transfers for current tenant
 * @access Private (Doctor, Nurse, Admin)
 */
router.get(
    '/pending',
    authorize('doctor', 'nurse', 'admin'),
    transferController.getPendingTransfers
);

/**
 * @route GET /api/v1/transfers/:id
 * @desc Get transfer by ID
 * @access Private (All authenticated users)
 */
router.get(
    '/:id',
    validate(transferIdSchema, 'params'),
    transferController.getTransferById
);

/**
 * @route POST /api/v1/transfers/:id/approve
 * @desc Approve transfer
 * @access Private (Doctor, Admin)
 */
router.post(
    '/:id/approve',
    authorize('doctor', 'admin'),
    validate(transferIdSchema, 'params'),
    validate(approveTransferSchema),
    transferController.approveTransfer
);

/**
 * @route POST /api/v1/transfers/:id/reject
 * @desc Reject transfer
 * @access Private (Doctor, Admin)
 */
router.post(
    '/:id/reject',
    authorize('doctor', 'admin'),
    validate(transferIdSchema, 'params'),
    validate(rejectTransferSchema),
    transferController.rejectTransfer
);

/**
 * @route POST /api/v1/transfers/:id/complete
 * @desc Complete transfer
 * @access Private (Doctor, Admin)
 */
router.post(
    '/:id/complete',
    authorize('doctor', 'admin'),
    validate(transferIdSchema, 'params'),
    transferController.completeTransfer
);

/**
 * @route POST /api/v1/transfers/:id/cancel
 * @desc Cancel transfer
 * @access Private (Doctor, Admin)
 */
router.post(
    '/:id/cancel',
    authorize('doctor', 'admin'),
    validate(transferIdSchema, 'params'),
    transferController.cancelTransfer
);

export default router;