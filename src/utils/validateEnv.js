import config from '../config/config.js';

export const validateEnvironment = () => {
    const warnings = [];
    const errors = [];

  // Check MongoDB connection string format
    if (!config.mongodb.uri.startsWith('mongodb://') && !config.mongodb.uri.startsWith('mongodb+srv://')) {
        errors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
    }

  // Check JWT secret strength
    if (config.jwt.secret.length < 32) {
        warnings.push('JWT_SECRET should be at least 32 characters long for better security');
    }

    if (config.jwt.secret === 'default-secret-change-me' || config.jwt.secret.includes('your-super-secret')) {
        warnings.push('JWT_SECRET is using a default value. Please change it in production!');
    }

  // Check environment
    if (config.env === 'production') {
    // Production checks
        if (config.security.corsOrigin === '*') {
            warnings.push('CORS_ORIGIN is set to "*" in production. Consider restricting it to specific domains');
        }
        
        if (config.security.sessionSecret === 'session-secret-change-me') {
            errors.push('SESSION_SECRET must be changed in production');
        }
        
        if (!config.cloudStorage.bucket) {
        warnings.push('CLOUD_STORAGE_BUCKET is not configured. File uploads will not work');
        }
    }

  // Display warnings and errors
    if (warnings.length > 0) {
        console.warn('\n⚠️  Configuration Warnings:');
        warnings.forEach(warning => console.warn(`   • ${warning}`));
    }

    if (errors.length > 0) {
        console.error('\n❌ Configuration Errors:');
        errors.forEach(error => console.error(`   • ${error}`));
        console.error('\nPlease fix the errors above before continuing.\n');
        process.exit(1);
    }

    if (warnings.length === 0 && errors.length === 0) {
        console.log('✅ Environment configuration looks good!\n');
    }
};

export default validateEnvironment;