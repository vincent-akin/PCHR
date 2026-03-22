import Patient from '../models/Patient.js';
import { ApiError } from '../utils/index.js';
import { updateTenantUsage } from '../middlewares/tenant.middleware.js';

/**
 * Create a new patient
 */
export const createPatient = async (patientData, userId, tenantId) => {
  // Check if patient with same hospital ID exists
    const existingPatient = await Patient.findOne({ 
        hospitalId: patientData.hospitalId,
        tenantId: tenantId
    });
    
    if (existingPatient) {
        throw ApiError.conflict('Patient with this hospital ID already exists');
    }
    
    // Check if patient with same email exists (if email provided)
    if (patientData.email) {
            const existingEmail = await Patient.findOne({ 
            email: patientData.email,
            tenantId: tenantId
        });
        if (existingEmail) {
            throw ApiError.conflict('Patient with this email already exists');
        }
    }
    
    // Create patient
    const patient = await Patient.create({
        ...patientData,
        tenantId: tenantId,
        createdBy: userId
    });
    
    // Update tenant usage statistics
    await updateTenantUsage(tenantId, { patients: 1 });
    
    return patient;
};

/**
 * Get patient by ID
 */
export const getPatientById = async (patientId, tenantId) => {
    const patient = await Patient.findOne({ 
        _id: patientId, 
        tenantId: tenantId,
        isDeleted: false 
    });
    
    if (!patient) {
        throw ApiError.notFound('Patient not found');
    }
    
    return patient;
};

/**
 * Get patient by hospital ID
 */
export const getPatientByHospitalId = async (hospitalId, tenantId) => {
    const patient = await Patient.findOne({ 
        hospitalId: hospitalId, 
        tenantId: tenantId,
        isDeleted: false 
    });
    
    if (!patient) {
        throw ApiError.notFound('Patient not found');
    }
    
    return patient;
};

/**
 * List patients with pagination and filters
 */
export const listPatients = async (tenantId, filters = {}, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { 
        tenantId: tenantId, 
        isDeleted: false 
    };
    
  // Apply filters
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
    
    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive === 'true';
    }
    
    if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }
    
    // Execute queries
    const [patients, total] = await Promise.all([
        Patient.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email'),
        Patient.countDocuments(query)
    ]);
    
    return {
        patients,
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
 * Update patient
 */
export const updatePatient = async (patientId, updateData, tenantId, userId) => {
    // Check if patient exists
    const patient = await getPatientById(patientId, tenantId);
    
    // Check for duplicate hospital ID if updating
    if (updateData.hospitalId && updateData.hospitalId !== patient.hospitalId) {
        const existingPatient = await Patient.findOne({ 
            hospitalId: updateData.hospitalId,
            tenantId: tenantId,
            _id: { $ne: patientId }
        });
        if (existingPatient) {
        throw ApiError.conflict('Patient with this hospital ID already exists');
        }
    }
    
  // Check for duplicate email if updating
        if (updateData.email && updateData.email !== patient.email) {
            const existingEmail = await Patient.findOne({ 
                email: updateData.email,
                tenantId: tenantId,
                _id: { $ne: patientId }
            });
        if (existingEmail) {
            throw ApiError.conflict('Patient with this email already exists');
        }
    }
    
    // Update patient
    const updatedPatient = await Patient.findByIdAndUpdate(
        patientId,
        {
            ...updateData,
            updatedBy: userId
        },
        { new: true, runValidators: true }
    );
    
    return updatedPatient;
};

/**
 * Delete patient (soft delete)
 */
export const deletePatient = async (patientId, tenantId, userId) => {
    // Check if patient exists
    await getPatientById(patientId, tenantId);
    
    // Soft delete
    const patient = await Patient.findByIdAndUpdate(
        patientId,
        {
            isDeleted: true,
            updatedBy: userId
        },
        { new: true }
    );
    
    return patient;
};

/**
 * Get patient statistics
 */
export const getPatientStats = async (tenantId) => {
    const stats = await Patient.aggregate([
        { $match: { tenantId: tenantId, isDeleted: false } },
        {
        $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
            male: { $sum: { $cond: [{ $eq: ['$gender', 'male'] }, 1, 0] } },
            female: { $sum: { $cond: [{ $eq: ['$gender', 'female'] }, 1, 0] } }
        }
        }
    ]);
    
  // Blood group distribution
    const bloodGroups = await Patient.aggregate([
        { $match: { tenantId: tenantId, isDeleted: false } },
        {
            $group: {
                _id: '$bloodGroup',
                count: { $sum: 1 }
            }
        }
    ]);
    
    return {
        total: stats[0]?.total || 0,
        active: stats[0]?.active || 0,
        inactive: stats[0]?.inactive || 0,
        male: stats[0]?.male || 0,
        female: stats[0]?.female || 0,
        bloodGroups: bloodGroups.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {})
    };
};