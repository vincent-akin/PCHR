import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
    // Server
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 8000,
    
    // Database
    mongodb: {
            uri: process.env.MONGODB_URI,
            options: {
            maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 10,
            minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) || 2,
            socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS, 10) || 45000,
            connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS, 10) || 30000,
            serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS, 10) || 5000,
            heartbeatFrequencyMS: parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY_MS, 10) || 10000,
            retryWrites: process.env.MONGODB_RETRY_WRITES === 'true',
            retryReads: process.env.MONGODB_RETRY_READS === 'true',
            }
        },
        
        // JWT
        jwt: {
            secret: process.env.JWT_SECRET || 'default-secret-change-me',
            accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
            refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
            issuer: process.env.JWT_ISSUER || 'pchr-backend',
            audience: process.env.JWT_AUDIENCE || 'pchr-clients'
        },
        
        // Rate Limiting
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
        },
        
        // File Upload
        fileUpload: {
            maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 20971520,
            allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'application/pdf']
        },
        
        // Cloud Storage
            cloudStorage: {
            provider: process.env.CLOUD_STORAGE_PROVIDER || 'aws',
            bucket: process.env.CLOUD_STORAGE_BUCKET,
            region: process.env.CLOUD_STORAGE_REGION,
            accessKeyId: process.env.CLOUD_STORAGE_ACCESS_KEY_ID,
            secretAccessKey: process.env.CLOUD_STORAGE_SECRET_ACCESS_KEY
        },
        
        // Security
        security: {
            bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
            corsOrigin: process.env.CORS_ORIGIN || '*',
            sessionSecret: process.env.SESSION_SECRET || 'session-secret-change-me'
        },
        
        // Logging
        logging: {
            level: process.env.LOG_LEVEL || 'info',
            format: process.env.LOG_FORMAT || 'combined'
        }
    };

    // Validate required configuration
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
        console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
        console.error('Please check your .env file');
        process.exit(1);
}

export default config;