import { validate } from './validate.middleware.js';
import { dashboardQuerySchema } from '../validators/dashboard.validator.js';

// Reusable middleware for dashboard endpoints that need pagination
export const validateDashboardQuery = validate(dashboardQuerySchema, 'query');