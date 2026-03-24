import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Patient from '../models/Patient.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Transfer from '../models/Transfer.js';
import { ApiError } from '../utils/index.js';

/**
 * Export patients to Excel
 */
export const exportPatientsToExcel = async (tenantId, filters = {}) => {
  // Get patients
    const query = { tenantId, isDeleted: false };
    
    if (filters.search) {
        query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
        { hospitalId: { $regex: filters.search, $options: 'i' } }
        ];
    }
    
    if (filters.bloodGroup) {
        query.bloodGroup = filters.bloodGroup;
    }
    
    if (filters.gender) {
        query.gender = filters.gender;
    }
    
    const patients = await Patient.find(query)
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name');
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Patients');
    
    // Define columns
    worksheet.columns = [
        { header: 'Hospital ID', key: 'hospitalId', width: 15 },
        { header: 'First Name', key: 'firstName', width: 15 },
        { header: 'Last Name', key: 'lastName', width: 15 },
        { header: 'Date of Birth', key: 'dob', width: 12 },
        { header: 'Age', key: 'age', width: 8 },
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Blood Group', key: 'bloodGroup', width: 12 },
        { header: 'Allergies', key: 'allergies', width: 20 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Registered By', key: 'createdBy', width: 20 },
        { header: 'Registered Date', key: 'createdAt', width: 20 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4CAF50' }
    };
    
    // Add data rows
    patients.forEach(patient => {
        worksheet.addRow({
            hospitalId: patient.hospitalId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            dob: patient.dateOfBirth ? patient.dateOfBirth.toISOString().split('T')[0] : '',
            age: patient.getAge(),
            gender: patient.gender,
            phone: patient.phone,
            email: patient.email || '',
            bloodGroup: patient.bloodGroup,
            allergies: patient.allergies?.join(', ') || '',
            status: patient.isActive ? 'Active' : 'Inactive',
            createdBy: patient.createdBy?.name || '',
            createdAt: patient.createdAt ? patient.createdAt.toLocaleString() : ''
        });
    });
    
    return workbook;
};

/**
 * Export patients to CSV
 */
export const exportPatientsToCSV = async (tenantId, filters = {}) => {
    const workbook = await exportPatientsToExcel(tenantId, filters);
    
    // Get CSV data
    const csvData = [];
    const worksheet = workbook.getWorksheet('Patients');
    
    // Get headers
    const headers = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value;
    });
    csvData.push(headers.join(','));
    
    // Get data rows
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        const rowData = [];
        row.eachCell(cell => {
        let value = cell.value;
        if (typeof value === 'string' && value.includes(',')) {
            value = `"${value}"`;
        }
        rowData.push(value);
        });
        csvData.push(rowData.join(','));
    });
    
    return csvData.join('\n');
};

/**
 * Export medical records to PDF
 */
export const exportRecordsToPDF = async (tenantId, patientId = null, filters = {}) => {
    // Build query
    const query = { tenantId, isDeleted: false };
    
    if (patientId) {
        query.patientId = patientId;
        const patient = await Patient.findById(patientId);
        if (!patient) {
            throw ApiError.notFound('Patient not found');
        }
    }
    
    if (filters.type) {
        query.type = filters.type;
    }
    
    if (filters.fromDate || filters.toDate) {
        query.createdAt = {};
        if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
        if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate);
    }
    
    const records = await MedicalRecord.find(query)
        .sort({ createdAt: -1 })
        .populate('patientId', 'firstName lastName hospitalId')
        .populate('doctorId', 'name');
    
    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    // Add header
    doc.fontSize(20).text('Medical Records Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();
    
    // Add patient info if specific patient
    if (patientId && records[0]?.patientId) {
        const patient = records[0].patientId;
        doc.fontSize(14).text('Patient Information', { underline: true });
        doc.fontSize(10).text(`Name: ${patient.fullName}`);
        doc.text(`Hospital ID: ${patient.hospitalId}`);
        doc.text(`Phone: ${patient.phone}`);
        if (patient.bloodGroup) doc.text(`Blood Group: ${patient.bloodGroup}`);
        doc.moveDown();
    }
    
    // Add records
    records.forEach((record, index) => {
        doc.fontSize(12).text(`${index + 1}. ${record.title}`, { underline: true });
        doc.fontSize(10);
        doc.text(`Type: ${record.type}`);
        doc.text(`Date: ${record.createdAt.toLocaleString()}`);
        doc.text(`Doctor: ${record.doctorId?.name || 'Unknown'}`);
        doc.text(`Notes: ${record.notes}`);
        
        if (record.diagnosis?.length > 0) {
            doc.text('Diagnoses:');
            record.diagnosis.forEach(d => {
                doc.text(`  - ${d.description} (${d.code})${d.isPrimary ? ' - Primary' : ''}`);
            });
        }
        
        if (record.medications?.length > 0) {
            doc.text('Medications:');
            record.medications.forEach(m => {
                doc.text(`  - ${m.name}: ${m.dosage}, ${m.frequency}`);
            });
        }
    
        if (record.vitalSigns) {
            doc.text('Vital Signs:');
            if (record.vitalSigns.bloodPressure) {
                doc.text(`  BP: ${record.vitalSigns.bloodPressure.systolic}/${record.vitalSigns.bloodPressure.diastolic}`);
            }
            if (record.vitalSigns.heartRate) doc.text(`  Heart Rate: ${record.vitalSigns.heartRate}`);
            if (record.vitalSigns.temperature) doc.text(`  Temperature: ${record.vitalSigns.temperature}°C`);
        }
    
        doc.moveDown();
    
        // Add page break every 5 records
        if ((index + 1) % 5 === 0 && index < records.length - 1) {
        doc.addPage();
        }
    });
    
    doc.end();
    
    return new Promise((resolve) => {
        doc.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
        });
    });
};

/**
 * Export transfers to Excel
 */
export const exportTransfersToExcel = async (tenantId, filters = {}) => {
    const query = {
        $or: [{ fromTenant: tenantId }, { toTenant: tenantId }],
        isDeleted: false
    };
    
    if (filters.status) {
        query.status = filters.status;
    }
    
    if (filters.fromDate || filters.toDate) {
        query.createdAt = {};
        if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
        if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate);
    }
    
    const transfers = await Transfer.find(query)
        .sort({ createdAt: -1 })
        .populate('patientId', 'firstName lastName hospitalId')
        .populate('requestedBy', 'name')
        .populate('approvedBy', 'name');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transfers');
    
    worksheet.columns = [
        { header: 'Transfer Code', key: 'code', width: 20 },
        { header: 'Patient', key: 'patient', width: 25 },
        { header: 'Hospital ID', key: 'hospitalId', width: 15 },
        { header: 'From', key: 'from', width: 20 },
        { header: 'To', key: 'to', width: 20 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Requested By', key: 'requestedBy', width: 20 },
        { header: 'Requested At', key: 'requestedAt', width: 20 },
        { header: 'Approved By', key: 'approvedBy', width: 20 },
        { header: 'Completed At', key: 'completedAt', width: 20 }
    ];
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2196F3' }
    };
    
    transfers.forEach(transfer => {
        worksheet.addRow({
            code: transfer.transferCode,
            patient: transfer.patientId?.fullName || 'Unknown',
            hospitalId: transfer.patientId?.hospitalId || '',
            from: transfer.fromTenant,
            to: transfer.toTenant,
            status: transfer.status,
            requestedBy: transfer.requestedBy?.name || '',
            requestedAt: transfer.requestedAt?.toLocaleString() || '',
            approvedBy: transfer.approvedBy?.name || '',
            completedAt: transfer.completedAt?.toLocaleString() || ''
        });
    });
    
    return workbook;
};