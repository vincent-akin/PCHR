import express from 'express';
import * as patientController from '../../controllers/patient.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { setTenantContext, validateTenant } from '../../middlewares/tenant.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { 
    createPatientSchema, 
    updatePatientSchema, 
    listPatientsSchema,
    patientIdSchema 
} from '../../validators/patient.validator.js';

const router = express.Router();

// All patient routes require authentication and tenant context
router.use(authenticate);
router.use(setTenantContext);
router.use(validateTenant);

/**
 * @route POST /api/v1/patients
 * @desc Create a new patient
 * @access Private (Doctor, Nurse, Admin)
 */
router.post(
    '/', 
    authorize('doctor', 'nurse', 'admin'), 
    validate(createPatientSchema), 
    patientController.createPatient
);

/**
 * @route GET /api/v1/patients
 * @desc List patients with pagination and filters
 * @access Private (All authenticated users)
 */
router.get(
    '/', 
    validate(listPatientsSchema, 'query'), 
    patientController.listPatients
);

/**
 * @route GET /api/v1/patients/stats
 * @desc Get patient statistics
 * @access Private (Doctor, Nurse, Admin)
 */
router.get(
    '/stats', 
    authorize('doctor', 'nurse', 'admin'), 
    patientController.getPatientStats
);

/**
 * @route GET /api/v1/patients/hospital/:hospitalId
 * @desc Get patient by hospital ID
 * @access Private (All authenticated users)
 */
router.get(
    '/hospital/:hospitalId', 
    patientController.getPatientByHospitalId
);

/**
 * @route GET /api/v1/patients/:id
 * @desc Get patient by ID
 * @access Private (All authenticated users)
 */
router.get(
    '/:id', 
    validate(patientIdSchema, 'params'), 
    patientController.getPatientById
);

/**
 * @route PUT /api/v1/patients/:id
 * @desc Update patient
 * @access Private (Doctor, Nurse, Admin)
 */
router.put(
    '/:id', 
    authorize('doctor', 'nurse', 'admin'), 
    validate(patientIdSchema, 'params'),
    validate(updatePatientSchema), 
    patientController.updatePatient
);

/**
 * @route DELETE /api/v1/patients/:id
 * @desc Delete patient (soft delete)
 * @access Private (Admin only)
 */
router.delete(
    '/:id', 
    authorize('admin'), 
    validate(patientIdSchema, 'params'), 
    patientController.deletePatient
);

export default router;