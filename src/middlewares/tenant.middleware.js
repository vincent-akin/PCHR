import { ApiError } from '../utils/index.js';
import Tenant from '../models/Tenant.js';

/**
 * Set tenant context from authenticated user
 * This should be used AFTER authentication middleware
 */
export const setTenantContext = (req, res, next) => {
    try {
        // If user is authenticated, get tenantId from user
        if (req.user && req.user.tenantId) {
            req.tenantId = req.user.tenantId;
            return next();
        }
        
        // If no user (public routes), skip tenant context
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Ensure tenant access is valid and active
 */
export const validateTenant = async (req, res, next) => {
    try {
        if (!req.tenantId) {
            return next();
        }
        
        // Check if tenant exists and is active
        const tenant = await Tenant.findById(req.tenantId);
        
        if (!tenant) {
            throw ApiError.forbidden('Tenant not found');
        }
        
        if (tenant.status !== 'active') {
            throw ApiError.forbidden('Tenant is not active. Please contact administrator');
        }
        
        // Attach tenant to request for use in controllers
        req.tenant = tenant;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Filter resources by tenantId
 * Use this in repository queries to ensure data isolation
 */
export const filterByTenant = (req, query = {}) => {
    if (req.tenantId) {
        return { ...query, tenantId: req.tenantId };
    }
    return query;
};

/**
 * Ensure user can only access resources from their tenant
 * Use this in controllers when accessing resources
 */
export const enforceTenantIsolation = (resourceTenantId) => {
    return (req, res, next) => {
        // Admin can bypass tenant isolation
        if (req.user && req.user.role === 'admin') {
            return next();
        }
    
    // Check if resource belongs to user's tenant
        if (resourceTenantId && resourceTenantId.toString() !== req.user.tenantId.toString()) {
            throw ApiError.forbidden('Access denied: Resource belongs to different institution');
        }
    
        next();
    };
};

/**
 * Get tenant statistics
 */
export const getTenantStats = async (tenantId) => {
    const stats = await Tenant.findById(tenantId).select('usage');
    return stats?.usage || {};
};

/**
 * Update tenant usage statistics
 */
export const updateTenantUsage = async (tenantId, increments = {}) => {
    const update = {};
    
    if (increments.patients) {
        update['usage.patientCount'] = increments.patients;
    }
    if (increments.records) {
        update['usage.recordCount'] = increments.records;
    }
    if (increments.transfers) {
        update['usage.transferCount'] = increments.transfers;
    }
    if (increments.storageMB) {
        update['usage.storageUsedGB'] = increments.storageMB / 1024;
    }
    
    if (Object.keys(update).length > 0) {
        await Tenant.findByIdAndUpdate(tenantId, {
        $inc: update,
        'usage.lastUpdated': new Date()
        });
    }
};