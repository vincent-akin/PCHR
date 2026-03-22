import * as patientService from '../services/patient.service.js';
import { asyncHandler, ApiResponse, ApiError } from '../utils/index.js';
import AuditLog from '../models/AuditLog.js';
import { AuditActions } from '../models/AuditLog.js';

/**
 * Create a new patient
 * POST /api/v1/patients
 */
export const createPatient = asyncHandler(async (req, res) => {
    const patient = await patientService.createPatient(
        req.body,
        req.user.userId,
        req.user.tenantId
    );
    
  // Log patient creation
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.PATIENT_CREATED,
        resourceType: 'patient',
        resourceId: patient._id,
        resourceName: patient.fullName,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `New patient created: ${patient.fullName}`,
        metadata: { hospitalId: patient.hospitalId }
    });
    
    return ApiResponse.created(patient, 'Patient created successfully').send(res);
});

/**
 * Get patient by ID
 * GET /api/v1/patients/:id
 */
export const getPatientById = asyncHandler(async (req, res) => {
    const patient = await patientService.getPatientById(
        req.params.id,
        req.user.tenantId
    );
    
    // Log patient view
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.PATIENT_VIEWED,
        resourceType: 'patient',
        resourceId: patient._id,
        resourceName: patient.fullName,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Patient record viewed: ${patient.fullName}`
    });
    
    return ApiResponse.success(patient, 'Patient retrieved successfully').send(res);
});

/**
 * Get patient by hospital ID
 * GET /api/v1/patients/hospital/:hospitalId
 */
export const getPatientByHospitalId = asyncHandler(async (req, res) => {
    const patient = await patientService.getPatientByHospitalId(
        req.params.hospitalId,
        req.user.tenantId
    );
    
    return ApiResponse.success(patient, 'Patient retrieved successfully').send(res);
});

/**
 * List patients
 * GET /api/v1/patients
 */
export const listPatients = asyncHandler(async (req, res) => {
    const { page, limit, search, bloodGroup, gender, isActive, dateFrom, dateTo } = req.query;
    
    const result = await patientService.listPatients(
        req.user.tenantId,
        { search, bloodGroup, gender, isActive, dateFrom, dateTo },
        parseInt(page) || 1,
        parseInt(limit) || 10
    );
    
    return ApiResponse.success(result, 'Patients retrieved successfully').send(res);
});

/**
 * Update patient
 * PUT /api/v1/patients/:id
 */
export const updatePatient = asyncHandler(async (req, res) => {
    const patient = await patientService.updatePatient(
        req.params.id,
        req.body,
        req.user.tenantId,
        req.user.userId
    );
    
  // Log patient update
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.PATIENT_UPDATED,
        resourceType: 'patient',
        resourceId: patient._id,
        resourceName: patient.fullName,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Patient updated: ${patient.fullName}`,
        metadata: { changes: Object.keys(req.body) }
    });
    
    return ApiResponse.success(patient, 'Patient updated successfully').send(res);
});

/**
 * Delete patient (soft delete)
 * DELETE /api/v1/patients/:id
 */
export const deletePatient = asyncHandler(async (req, res) => {
    const patient = await patientService.deletePatient(
        req.params.id,
        req.user.tenantId,
        req.user.userId
    );
    
    // Log patient deletion
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.PATIENT_DELETED,
        resourceType: 'patient',
        resourceId: patient._id,
        resourceName: patient.fullName,
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Patient deleted: ${patient.fullName}`
    });
    
    return ApiResponse.success(null, 'Patient deleted successfully').send(res);
});

/**
 * Get patient statistics
 * GET /api/v1/patients/stats
 */
export const getPatientStats = asyncHandler(async (req, res) => {
    const stats = await patientService.getPatientStats(req.user.tenantId);
    return ApiResponse.success(stats, 'Patient statistics retrieved').send(res);
});