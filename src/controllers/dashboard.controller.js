import * as dashboardService from '../services/dashboard.service.js';
import { asyncHandler, ApiResponse, ApiError } from '../utils/index.js';
import { dashboardQuerySchema } from '../validators/dashboard.validator.js';

/**
 * Get main dashboard stats
 * GET /api/v1/dashboard/stats
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await dashboardService.getDashboardStats(req.user.tenantId);
    return ApiResponse.success(stats, 'Dashboard statistics retrieved').send(res);
});

/**
 * Get patient demographics
 * GET /api/v1/dashboard/demographics
 */
export const getPatientDemographics = asyncHandler(async (req, res) => {
    const demographics = await dashboardService.getPatientDemographics(req.user.tenantId);
    return ApiResponse.success(demographics, 'Patient demographics retrieved').send(res);
});

/**
 * Get record distribution
 * GET /api/v1/dashboard/record-distribution
 */
export const getRecordDistribution = asyncHandler(async (req, res) => {
    const distribution = await dashboardService.getRecordDistribution(req.user.tenantId);
    return ApiResponse.success(distribution, 'Record distribution retrieved').send(res);
});

/**
 * Get recent activity
 * GET /api/v1/dashboard/activity
 */
export const getRecentActivity = asyncHandler(async (req, res) => {
    // Validate query parameters
    const { error, value } = dashboardQuerySchema.validate(req.query);
    if (error) {
        throw ApiError.badRequest(error.details[0].message);
    }
    
    const { limit } = value;
    const activities = await dashboardService.getRecentActivity(
        req.user.tenantId,
        limit
    );
    return ApiResponse.success(activities, 'Recent activity retrieved').send(res);
});

/**
 * Get top doctors
 * GET /api/v1/dashboard/top-doctors
 */
export const getTopDoctors = asyncHandler(async (req, res) => {
    // Validate query parameters
    const { error, value } = dashboardQuerySchema.validate(req.query);
    if (error) {
        throw ApiError.badRequest(error.details[0].message);
    }
    
    const { limit } = value;
    const topDoctors = await dashboardService.getTopDoctors(
        req.user.tenantId,
        limit
    );
    return ApiResponse.success(topDoctors, 'Top doctors retrieved').send(res);
});

/**
 * Get monthly trends
 * GET /api/v1/dashboard/trends
 */
export const getMonthlyTrends = asyncHandler(async (req, res) => {
    // Validate query parameters
    const { error, value } = dashboardQuerySchema.validate(req.query);
    if (error) {
        throw ApiError.badRequest(error.details[0].message);
    }
    
    const { months } = value;
    const trends = await dashboardService.getMonthlyTrends(
        req.user.tenantId,
        months
    );
    return ApiResponse.success(trends, 'Monthly trends retrieved').send(res);
});

/**
 * Get storage breakdown
 * GET /api/v1/dashboard/storage
 */
export const getStorageBreakdown = asyncHandler(async (req, res) => {
    const breakdown = await dashboardService.getStorageBreakdown(req.user.tenantId);
    return ApiResponse.success(breakdown, 'Storage breakdown retrieved').send(res);
});

/**
 * Get alerts
 * GET /api/v1/dashboard/alerts
 */
export const getAlerts = asyncHandler(async (req, res) => {
    const alerts = await dashboardService.getAlerts(req.user.tenantId);
    return ApiResponse.success(alerts, 'Alerts retrieved').send(res);
});