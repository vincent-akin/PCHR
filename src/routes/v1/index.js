import express from 'express';
import authRoutes from './auth.routes.js';
import tenantRoutes from './tenant.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);

export default router;