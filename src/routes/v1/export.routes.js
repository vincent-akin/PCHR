import express from 'express';
import * as exportController from '../../controllers/export.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { setTenantContext, validateTenant } from '../../middlewares/tenant.middleware.js';

const router = express.Router();

// All export routes require authentication
router.use(authenticate);
router.use(setTenantContext);
router.use(validateTenant);

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Data export endpoints
 */

/**
 * @swagger
 * /export/patients/excel:
 *   get:
 *     summary: Export patients to Excel
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, phone, or hospital ID
 *       - in: query
 *         name: bloodGroup
 *         schema:
 *           type: string
 *         description: Filter by blood group
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: Filter by gender
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor/Admin only
 */
router.get('/patients/excel', authorize('doctor', 'admin'), exportController.exportPatientsToExcel);

/**
 * @swagger
 * /export/patients/csv:
 *   get:
 *     summary: Export patients to CSV
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, phone, or hospital ID
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/patients/csv', authorize('doctor', 'admin'), exportController.exportPatientsToCSV);

/**
 * @swagger
 * /export/records/pdf:
 *   get:
 *     summary: Export medical records to PDF
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *         description: Filter by patient ID (optional)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by record type
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/records/pdf', authorize('doctor', 'admin'), exportController.exportRecordsToPDF);

/**
 * @swagger
 * /export/transfers/excel:
 *   get:
 *     summary: Export transfers to Excel
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed, cancelled]
 *         description: Filter by transfer status
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *     responses:
 *       200:
 *         description: Excel file download
 */
router.get('/transfers/excel', authorize('doctor', 'admin'), exportController.exportTransfersToExcel);

export default router;