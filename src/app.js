import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';

import v1Routes from './routes/v1/index.js';
import testRoutes from './routes/test.routes.js';
import httpStatus from './utils/httpStatus.js';
import { swaggerSpec } from './config/swagger.js';

dotenv.config();

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'PCHR Platform API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        tryItOutEnabled: true
    }
}));

// Serve swagger.json
app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(httpStatus.OK).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'PCHR Backend',
        environment: process.env.NODE_ENV || 'development',
        docs: '/api/docs'
    });
});

// API v1 routes
app.use('/api/v1', v1Routes);

// Test routes (remove in production)
app.use('/api/v1/test', testRoutes);

// 404 handler
app.use((req, res) => {
    res.status(httpStatus.NOT_FOUND).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
            statusCode: httpStatus.NOT_FOUND
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || 'An unexpected error occurred';
    const code = err.code || 'INTERNAL_SERVER_ERROR';

    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            statusCode,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});

export default app;