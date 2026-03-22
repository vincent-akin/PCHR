import express from 'express';
import * as recordController from '../../controllers/record.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { setTenantContext, validateTenant } from '../../middlewares/tenant.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { 
    createRecordSchema, 
    updateRecordSchema, 
    listRecordsSchema,
    recordIdSchema,
    patientIdSchema
} from '../../validators/record.validator.js';

const router = express.Router();

// All record routes require authentication and tenant context
router.use(authenticate);
router.use(setTenantContext);
router.use(validateTenant);

/**
 * @route POST /api/v1/records
 * @desc Create a new medical record
 * @access Private (Doctor, Admin)
 */
router.post(
    '/', 
    authorize('doctor', 'admin'), 
    validate(createRecordSchema), 
    recordController.createRecord
);

/**
 * @route GET /api/v1/records
 * @desc Get records with filters
 * @access Private (All authenticated users)
 */
router.get(
    '/', 
    validate(listRecordsSchema, 'query'), 
    recordController.getRecordsByType
);

/**
 * @route GET /api/v1/records/stats
 * @desc Get record statistics
 * @access Private (Doctor, Nurse, Admin)
 */
router.get(
    '/stats', 
    authorize('doctor', 'nurse', 'admin'), 
    recordController.getRecordStats
);

/**
 * @route GET /api/v1/records/patient/:patientId
 * @desc Get patient's medical records
 * @access Private (All authenticated users)
 */
router.get(
    '/patient/:patientId', 
    validate(patientIdSchema, 'params'),
    validate(listRecordsSchema, 'query'),
    recordController.getPatientRecords
);

/**
 * @route GET /api/v1/records/type/:type
 * @desc Get records by type
 * @access Private (Doctor, Nurse, Admin)
 */
router.get(
    '/type/:type', 
    authorize('doctor', 'nurse', 'admin'),
    recordController.getRecordsByType
);

/**
 * @route GET /api/v1/records/:id
 * @desc Get record by ID
 * @access Private (All authenticated users)
 */
router.get(
    '/:id', 
    validate(recordIdSchema, 'params'), 
    recordController.getRecordById
);

/**
 * @route PUT /api/v1/records/:id
 * @desc Update medical record
 * @access Private (Doctor, Admin)
 */
router.put(
    '/:id', 
    authorize('doctor', 'admin'),
    validate(recordIdSchema, 'params'),
    validate(updateRecordSchema), 
    recordController.updateRecord
);

/**
 * @route DELETE /api/v1/records/:id
 * @desc Delete medical record (soft delete)
 * @access Private (Admin only)
 */
router.delete(
    '/:id', 
    authorize('admin'), 
    validate(recordIdSchema, 'params'), 
    recordController.deleteRecord
);

export default router;