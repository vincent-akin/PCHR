import * as exportService from '../services/export.service.js';
import { asyncHandler, ApiResponse } from '../utils/index.js';
import AuditLog from '../models/AuditLog.js';
import { AuditActions } from '../models/AuditLog.js';
import mongoose from 'mongoose';

/**
 * Export patients to Excel
 * GET /api/v1/export/patients/excel
 */
export const exportPatientsToExcel = asyncHandler(async (req, res) => {
    const { search, bloodGroup, gender, dateFrom, dateTo } = req.query;
    
    const workbook = await exportService.exportPatientsToExcel(
        req.user.tenantId,
        { search, bloodGroup, gender, dateFrom, dateTo }
    );
    
    // Log export with a valid resourceId
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: 'record_exported',
        resourceType: 'patient',
        resourceId: new mongoose.Types.ObjectId(), // Generate a valid ObjectId
        resourceName: 'patients_export',
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: 'Exported patients to Excel',
        metadata: { format: 'excel', filters: { search, bloodGroup, gender } }
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=patients_${Date.now()}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
});

/**
 * Export patients to CSV
 * GET /api/v1/export/patients/csv
 */
export const exportPatientsToCSV = asyncHandler(async (req, res) => {
    const { search, bloodGroup, gender, dateFrom, dateTo } = req.query;
    
    const csvData = await exportService.exportPatientsToCSV(
        req.user.tenantId,
        { search, bloodGroup, gender, dateFrom, dateTo }
    );
    
    // Log export with a valid resourceId
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: 'record_exported',
        resourceType: 'patient',
        resourceId: new mongoose.Types.ObjectId(),
        resourceName: 'patients_export',
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: 'Exported patients to CSV',
        metadata: { format: 'csv', filters: { search, bloodGroup, gender } }
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=patients_${Date.now()}.csv`);
    res.send(csvData);
});

/**
 * Export records to PDF
 * GET /api/v1/export/records/pdf
 */
export const exportRecordsToPDF = asyncHandler(async (req, res) => {
    const { patientId, type, fromDate, toDate } = req.query;
    
    const pdfBuffer = await exportService.exportRecordsToPDF(
        req.user.tenantId,
        patientId,
        { type, fromDate, toDate }
    );
    
    // Log export with a valid resourceId
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: 'record_exported',
        resourceType: 'record',
        resourceId: patientId ? new mongoose.Types.ObjectId(patientId) : new mongoose.Types.ObjectId(),
        resourceName: patientId ? 'patient_records_export' : 'all_records_export',
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Exported records to PDF${patientId ? ` for patient ${patientId}` : ''}`,
        metadata: { format: 'pdf', patientId, type, fromDate, toDate }
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=records_${Date.now()}.pdf`);
    res.send(pdfBuffer);
});

/**
 * Export transfers to Excel
 * GET /api/v1/export/transfers/excel
 */
export const exportTransfersToExcel = asyncHandler(async (req, res) => {
    const { status, fromDate, toDate } = req.query;
    
    const workbook = await exportService.exportTransfersToExcel(
        req.user.tenantId,
        { status, fromDate, toDate }
    );
    
    // Log export with a valid resourceId
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: 'record_exported',
        resourceType: 'transfer',
        resourceId: new mongoose.Types.ObjectId(),
        resourceName: 'transfers_export',
        tenantId: req.user.tenantId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: 'Exported transfers to Excel',
        metadata: { format: 'excel', status, fromDate, toDate }
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=transfers_${Date.now()}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
});