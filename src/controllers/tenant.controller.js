import * as tenantService from '../services/tenant.service.js';
import { asyncHandler, ApiResponse, ApiError } from '../utils/index.js';
import AuditLog from '../models/AuditLog.js';
import { AuditActions } from '../models/AuditLog.js';

/**
 * Create a new tenant
 * POST /api/v1/tenants
 */
export const createTenant = asyncHandler(async (req, res) => {
    const tenant = await tenantService.createTenant(req.body);
    
    // Log tenant creation
    await AuditLog.log({
        userId: req.user?.userId,
        userRole: req.user?.role,
        userEmail: req.user?.email,
        userName: req.user?.name,
        action: AuditActions.TENANT_CREATED,
        resourceType: 'tenant',
        resourceId: tenant._id,
        resourceName: tenant.name,
        tenantId: tenant._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `New tenant created: ${tenant.name}`,
        metadata: { type: tenant.type }
    });
    
    return ApiResponse.created(tenant, 'Tenant created successfully').send(res);
});

/**
 * Get current tenant
 * GET /api/v1/tenants/me
 */
export const getCurrentTenant = asyncHandler(async (req, res) => {
    const tenant = await tenantService.getTenantById(req.tenantId);
    return ApiResponse.success(tenant, 'Tenant retrieved successfully').send(res);
});

/**
 * Get tenant by ID
 * GET /api/v1/tenants/:id
 */
export const getTenantById = asyncHandler(async (req, res) => {
    const tenant = await tenantService.getTenantById(req.params.id);
    
  // Check authorization
    if (req.user.role !== 'admin' && req.tenantId.toString() !== tenant._id.toString()) {
        throw ApiError.forbidden('You can only access your own tenant data');
    }
    
    return ApiResponse.success(tenant, 'Tenant retrieved successfully').send(res);
});

/**
 * Update tenant
 * PUT /api/v1/tenants/:id
 */
export const updateTenant = asyncHandler(async (req, res) => {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    
    // Log tenant update
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.TENANT_UPDATED,
        resourceType: 'tenant',
        resourceId: tenant._id,
        resourceName: tenant.name,
        tenantId: tenant._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Tenant updated: ${tenant.name}`,
        metadata: { changes: Object.keys(req.body) }
    });
    
    return ApiResponse.success(tenant, 'Tenant updated successfully').send(res);
});

/**
 * List tenants (Admin only)
 * GET /api/v1/tenants
 */
export const listTenants = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, type, search } = req.query;
    
    const result = await tenantService.listTenants(
        { status, type, search },
        parseInt(page),
        parseInt(limit)
    );
    
    return ApiResponse.success(result, 'Tenants retrieved successfully').send(res);
});

/**
 * Get tenant usage statistics
 * GET /api/v1/tenants/me/usage
 */
export const getTenantUsage = asyncHandler(async (req, res) => {
    const usage = await tenantService.getTenantUsage(req.tenantId);
    return ApiResponse.success(usage, 'Tenant usage retrieved').send(res);
});

/**
 * Activate tenant (Admin only)
 * POST /api/v1/tenants/:id/activate
 */
export const activateTenant = asyncHandler(async (req, res) => {
    const tenant = await tenantService.activateTenant(req.params.id);
    
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.TENANT_CONFIGURED,
        resourceType: 'tenant',
        resourceId: tenant._id,
        resourceName: tenant.name,
        tenantId: tenant._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Tenant activated: ${tenant.name}`
    });
    
    return ApiResponse.success(tenant, 'Tenant activated successfully').send(res);
});

/**
 * Suspend tenant (Admin only)
 * POST /api/v1/tenants/:id/suspend
 */
export const suspendTenant = asyncHandler(async (req, res) => {
    const tenant = await tenantService.suspendTenant(req.params.id);
    
    await AuditLog.log({
        userId: req.user.userId,
        userRole: req.user.role,
        userEmail: req.user.email,
        userName: req.user.name,
        action: AuditActions.TENANT_CONFIGURED,
        resourceType: 'tenant',
        resourceId: tenant._id,
        resourceName: tenant.name,
        tenantId: tenant._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: `Tenant suspended: ${tenant.name}`
    });
    
    return ApiResponse.success(tenant, 'Tenant suspended successfully').send(res);
});