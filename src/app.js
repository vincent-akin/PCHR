import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import httpStatus from './utils/httpStatus.js';
import testRoutes from './routes/test.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(httpStatus.OK).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'PCHR Backend',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test routes (remove in production)
app.use('/api/v1/test', testRoutes);

// API routes will be added here
// app.use('/api/v1', routes);

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