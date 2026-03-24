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
 * @swagger
 * tags:
 *   name: Patients
 *   description: Patient management endpoints
 */

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - dateOfBirth
 *               - gender
 *               - phone
 *               - hospitalId
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-15
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *                 example: male
 *               phone:
 *                 type: string
 *                 example: +2347012345678
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@email.com
 *               bloodGroup:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *                 example: O+
 *               hospitalId:
 *                 type: string
 *                 example: HOSP001
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Penicillin", "Peanuts"]
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor/Nurse only
 *       409:
 *         description: Patient with this hospital ID already exists
 */
router.post(
    '/', 
    authorize('doctor', 'nurse', 'admin'), 
    validate(createPatientSchema), 
    patientController.createPatient
);

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: List patients with pagination and filters
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, phone, or hospital ID
 *       - in: query
 *         name: bloodGroup
 *         schema:
 *           type: string
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *         description: Filter by blood group
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other]
 *         description: Filter by gender
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/', 
    validate(listPatientsSchema, 'query'), 
    patientController.listPatients
);

/**
 * @swagger
 * /patients/stats:
 *   get:
 *     summary: Get patient statistics
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     male:
 *                       type: integer
 *                     female:
 *                       type: integer
 *                     bloodGroups:
 *                       type: object
 */
router.get(
    '/stats', 
    authorize('doctor', 'nurse', 'admin'), 
    patientController.getPatientStats
);

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient retrieved successfully
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/:id', 
    validate(patientIdSchema, 'params'), 
    patientController.getPatientById
);

/**
 * @swagger
 * /patients/{id}:
 *   put:
 *     summary: Update patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient not found
 */
router.put(
    '/:id', 
    authorize('doctor', 'nurse', 'admin'), 
    validate(patientIdSchema, 'params'),
    validate(updatePatientSchema), 
    patientController.updatePatient
);

/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     summary: Delete patient (soft delete)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Patient not found
 */
router.delete(
    '/:id', 
    authorize('admin'), 
    validate(patientIdSchema, 'params'), 
    patientController.deletePatient
);

export default router;