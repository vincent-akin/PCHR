import MedicalRecord from '../models/MedicalRecord.js';
import Patient from '../models/Patient.js';
import { ApiError } from '../utils/index.js';
import { updateTenantUsage } from '../middlewares/tenant.middleware.js';

/**
 * Create a new medical record
 */
export const createRecord = async (recordData, userId, tenantId) => {
    // Verify patient exists and belongs to tenant
    const patient = await Patient.findOne({ 
        _id: recordData.patientId, 
        tenantId: tenantId,
        isDeleted: false 
    });
    
    if (!patient) {
        throw ApiError.notFound('Patient not found');
    }
    
    // Create record
    const record = await MedicalRecord.create({
        ...recordData,
        tenantId: tenantId,
        createdBy: userId,
        doctorId: userId // Current user is the doctor
    });
    
    // Update tenant usage
    await updateTenantUsage(tenantId, { records: 1 });
    
    return record;
};

/**
 * Get record by ID
 */
export const getRecordById = async (recordId, tenantId) => {
    const record = await MedicalRecord.findOne({ 
        _id: recordId, 
        tenantId: tenantId,
        isDeleted: false 
    })
    .populate('patientId', 'firstName lastName hospitalId')
    .populate('doctorId', 'name email specialization');
    
    if (!record) {
        throw ApiError.notFound('Medical record not found');
    }
    
    return record;
};

/**
 * Get patient's medical records
 */
export const getPatientRecords = async (patientId, tenantId, filters = {}, page = 1, limit = 10) => {
    // Verify patient exists
    const patient = await Patient.findOne({ 
        _id: patientId, 
        tenantId: tenantId,
        isDeleted: false 
    });
    
    if (!patient) {
        throw ApiError.notFound('Patient not found');
    }
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { 
        patientId: patientId, 
        tenantId: tenantId,
        isDeleted: false 
    };
    
    // Apply filters
    if (filters.type) {
        query.type = filters.type;
    }
    
    if (filters.status) {
        query.status = filters.status;
    }
    
    if (filters.fromDate || filters.toDate) {
        query.createdAt = {};
        if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
        if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate);
    }
    
    if (filters.search) {
        query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { notes: { $regex: filters.search, $options: 'i' } }
        ];
    }
    
    // Execute queries
    const [records, total] = await Promise.all([
        MedicalRecord.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('doctorId', 'name email specialization'),
        MedicalRecord.countDocuments(query)
    ]);
    
    return {
        patient: {
            id: patient._id,
            name: patient.fullName,
            hospitalId: patient.hospitalId
        },
        records,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    };
};

/**
 * Update medical record
 */
export const updateRecord = async (recordId, updateData, tenantId, userId) => {
    // Check if record exists
    const record = await getRecordById(recordId, tenantId);
    
    // Only the creating doctor or admin can update
    if (record.doctorId._id.toString() !== userId && req.user.role !== 'admin') {
        throw ApiError.forbidden('Only the attending doctor or admin can update this record');
    }
    
    // Update record
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
            ...updateData,
            updatedBy: userId,
            status: 'amended' // Mark as amended when updated
        },
        { new: true, runValidators: true }
    );
    
    return updatedRecord;
};

/**
 * Delete medical record (soft delete - admin only)
 */
export const deleteRecord = async (recordId, tenantId, userId) => {
  // Check if record exists
    await getRecordById(recordId, tenantId);
    
    // Soft delete
    const record = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
        isDeleted: true,
        updatedBy: userId
        },
        { new: true }
    );
    
    return record;
};

/**
 * Get records by type
 */
export const getRecordsByType = async (tenantId, recordType, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
    
    const query = { 
        tenantId: tenantId,
        type: recordType,
        isDeleted: false 
    };
    
    const [records, total] = await Promise.all([
        MedicalRecord.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('patientId', 'firstName lastName hospitalId')
        .populate('doctorId', 'name email'),
        MedicalRecord.countDocuments(query)
    ]);
    
    return {
        records,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get record statistics
 */
export const getRecordStats = async (tenantId, patientId = null) => {
    const matchStage = { 
        tenantId: tenantId,
        isDeleted: false 
    };
    
    if (patientId) {
        matchStage.patientId = patientId;
    }
    
    const stats = await MedicalRecord.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]);
    
    // Get monthly trend
    const monthlyTrend = await MedicalRecord.aggregate([
        { $match: matchStage },
        {
        $group: {
            _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
        }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
    ]);
    
    // Get top doctors
    const topDoctors = await MedicalRecord.aggregate([
        { $match: matchStage },
        {
        $group: {
            _id: '$doctorId',
            recordCount: { $sum: 1 }
        }
        },
        { $sort: { recordCount: -1 } },
        { $limit: 5 },
        {
        $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'doctor'
        }
        },
        { $unwind: '$doctor' },
        {
        $project: {
            doctorId: '$_id',
            doctorName: '$doctor.name',
            doctorEmail: '$doctor.email',
            recordCount: 1
        }
        }
    ]);
    
    return {
        byType: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
        }, {}),
        monthlyTrend: monthlyTrend.map(item => ({
        month: `${item._id.year}-${item._id.month}`,
        count: item.count
        })),
        topDoctors,
        total: await MedicalRecord.countDocuments(matchStage)
    };
};