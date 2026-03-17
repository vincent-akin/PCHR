import mongoose from 'mongoose';
import app from './app.js';
import config from './config/config.js';
import connectDB from './config/database.js';
import validateEnvironment from './utils/validateEnv.js';

// Validate environment variables
validateEnvironment();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
    process.exit(1);
});

// Start server
const startServer = async () => {
    try {
    // Connect to MongoDB
        await connectDB();
    
    // Start Express server
        const server = app.listen(config.port, () => {
            console.log(`\n🚀 Server started successfully!`);
            console.log(`   Environment: ${config.env}`);
            console.log(`   Port: ${config.port}`);
            console.log(`   MongoDB: ${config.mongodb.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide credentials
            console.log(`   Health check: http://localhost:${config.port}/health`);
            console.log(`   API Base: http://localhost:${config.port}/api/v1`);
            console.log(`   Test endpoints: http://localhost:${config.port}/api/v1/test\n`);
        });

    // Graceful shutdown
        const gracefulShutdown = async () => {
            console.log('\n\n🛑 Received shutdown signal. Closing connections...');
        
            server.close(async () => {
                console.log('✅ HTTP server closed');
            
                try {
                    await mongoose.connection.close();
                    console.log('✅ MongoDB connection closed');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };

    // Listen for shutdown signals
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
        
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
};

startServer();