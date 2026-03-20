import Tenant from '../models/Tenant.js';
import { ApiError } from '../utils/index.js';
import { updateTenantUsage } from '../middlewares/tenant.middleware.js';

/**
 * Create a new tenant (hospital/clinic/lab)
 */
export const createTenant = async (tenantData) => {
    // Check if tenant already exists
    const existingTenant = await Tenant.findOne({ 
        $or: [
            { name: tenantData.name },
            { registrationNumber: tenantData.registrationNumber }
        ]
    });
    
    if (existingTenant) {
        throw ApiError.conflict('Tenant with this name or registration number already exists');
    }
    
    const tenant = await Tenant.create(tenantData);
    return tenant;
};

/**
 * Get tenant by ID
 */
export const getTenantById = async (tenantId) => {
    const tenant = await Tenant.findById(tenantId);
    
    if (!tenant) {
        throw ApiError.notFound('Tenant not found');
    }
    
    return tenant;
};

/**
 * Update tenant
 */
export const updateTenant = async (tenantId, updateData) => {
    const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        updateData,
        { new: true, runValidators: true }
    );
    
    if (!tenant) {
        throw ApiError.notFound('Tenant not found');
    }
    
    return tenant;
};

/**
 * List tenants with pagination
 */
export const listTenants = async (filters = {}, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    
    const query = {};
    
    if (filters.status) {
        query.status = filters.status;
    }
    
    if (filters.type) {
        query.type = filters.type;
    }
    
    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: 'i' } },
            { email: { $regex: filters.search, $options: 'i' } }
        ];
    }
    
    const [tenants, total] = await Promise.all([
        Tenant.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
        Tenant.countDocuments(query)
    ]);
    
    return {
        tenants,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get tenant usage statistics
 */
export const getTenantUsage = async (tenantId) => {
    const tenant = await getTenantById(tenantId);
    
    return {
        storageUsedGB: tenant.usage.storageUsedGB,
        userCount: tenant.usage.userCount,
        patientCount: tenant.usage.patientCount,
        recordCount: tenant.usage.recordCount,
        transferCount: tenant.usage.transferCount,
        maxStorageGB: tenant.config.maxStorageGB,
        maxUsers: tenant.config.maxUsers,
        maxPatients: tenant.config.maxPatients
    };
};

/**
 * Check if tenant has available storage
 */
export const hasAvailableStorage = async (tenantId, requiredMB) => {
    const tenant = await getTenantById(tenantId);
    const requiredGB = requiredMB / 1024;
    
    return (tenant.usage.storageUsedGB + requiredGB) <= tenant.config.maxStorageGB;
};

/**
 * Check if tenant can add more users
 */
export const canAddUser = async (tenantId) => {
    const tenant = await getTenantById(tenantId);
    return tenant.usage.userCount < tenant.config.maxUsers;
};

/**
 * Check if tenant can add more patients
 */
export const canAddPatient = async (tenantId) => {
    const tenant = await getTenantById(tenantId);
    return tenant.usage.patientCount < tenant.config.maxPatients;
};

/**
 * Update tenant statistics (wrapper)
 */
export const updateTenantStats = async (tenantId, increments) => {
    await updateTenantUsage(tenantId, increments);
};

/**
 * Activate tenant
 */
export const activateTenant = async (tenantId) => {
    const tenant = await updateTenant(tenantId, { status: 'active' });
    return tenant;
};

/**
 * Suspend tenant
 */
export const suspendTenant = async (tenantId) => {
    const tenant = await updateTenant(tenantId, { status: 'suspended' });
    return tenant;
};