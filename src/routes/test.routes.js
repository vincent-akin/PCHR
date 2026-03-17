import express from 'express';
import { testController } from '../controllers/test.controller.js';

const router = express.Router();

router.get('/success', testController.success);
router.get('/created', testController.created);
router.get('/error', testController.error);
router.get('/unauthorized', testController.unauthorized);
router.get('/not-found', testController.notFound);
router.get('/validation-error', testController.validationError);
router.get('/status-codes', testController.statusCodes);

export default router;