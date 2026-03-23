import express from 'express';
import authRoutes from './auth.routes.js';
import tenantRoutes from './tenant.routes.js';
import patientRoutes from './patient.routes.js'
import recordRoutes from './record.routes.js';
import fileRoutes from './file.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/patients', patientRoutes);
router.use('/records', recordRoutes);
router.use('/files', fileRoutes);

// Health check for v1
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        version: 'v1',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

export default router;