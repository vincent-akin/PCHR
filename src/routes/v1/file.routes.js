import express from 'express';
import * as fileController from '../../controllers/file.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { setTenantContext, validateTenant } from '../../middlewares/tenant.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { 
    fileMetadataSchema, 
    fileIdSchema,
    patientIdSchema,
    recordIdSchema,
    listFilesSchema
} from '../../validators/file.validator.js';

const router = express.Router();

// All file routes require authentication and tenant context
router.use(authenticate);
router.use(setTenantContext);
router.use(validateTenant);

/**
 * @route POST /api/v1/files/upload
 * @desc Upload a file
 * @access Private (Doctor, Nurse, Admin)
 */
router.post(
    '/upload',
    authorize('doctor', 'nurse', 'admin'),
    validate(fileMetadataSchema, 'body'),
    fileController.uploadFile
);

/**
 * @route GET /api/v1/files/stats
 * @desc Get file statistics
 * @access Private (Doctor, Admin)
 */
router.get(
    '/stats',
    authorize('doctor', 'admin'),
    fileController.getFileStats
);

/**
 * @route GET /api/v1/files/patient/:patientId
 * @desc Get patient's files
 * @access Private (All authenticated users)
 */
router.get(
    '/patient/:patientId',
    validate(patientIdSchema, 'params'),
    validate(listFilesSchema, 'query'),
    fileController.getPatientFiles
);

/**
 * @route GET /api/v1/files/record/:recordId
 * @desc Get record's files
 * @access Private (All authenticated users)
 */
router.get(
    '/record/:recordId',
    validate(recordIdSchema, 'params'),
    validate(listFilesSchema, 'query'),
    fileController.getRecordFiles
);

/**
 * @route GET /api/v1/files/:id
 * @desc Get file by ID
 * @access Private (All authenticated users)
 */
router.get(
    '/:id',
    validate(fileIdSchema, 'params'),
    fileController.getFileById
);

/**
 * @route GET /api/v1/files/:id/download
 * @desc Download file
 * @access Private (All authenticated users)
 */
router.get(
    '/:id/download',
    validate(fileIdSchema, 'params'),
    fileController.downloadFile
);

/**
 * @route DELETE /api/v1/files/:id
 * @desc Delete file
 * @access Private (Admin only)
 */
router.delete(
    '/:id',
    authorize('admin'),
    validate(fileIdSchema, 'params'),
    fileController.deleteFile
);

export default router;