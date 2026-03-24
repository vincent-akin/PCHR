import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PCHR Platform API',
            version: '1.0.0',
            description: `
                Patient Clinical Health Record Platform - Secure Healthcare API
                
                ## Features:
                - 🔐 JWT Authentication
                - 🏥 Multi-tenant Hospital Management
                - 👨‍⚕️ Patient Records Management
                - 📋 Medical Documentation
                - 📁 File Upload (X-rays, Reports)
                - 🔄 Inter-hospital Record Transfers
                - 📊 Dashboard Analytics
                - 🔔 Notification System
                - 📎 Data Export (Excel, PDF, CSV)
                
                ## Authentication:
                Use the \`/api/v1/auth/login\` endpoint to get an access token.
                Then include the token in the Authorization header:
                \`Authorization: Bearer your-token-here\`
            `,
            contact: {
                name: 'PCHR Support',
                email: 'support@pchr.com',
                url: 'https://pchr.com'
            },
            license: {
                name: 'ISC',
                url: 'https://opensource.org/licenses/ISC'
            }
        },
        servers: [
        {
            url: 'http://localhost:8000/api/v1',
            description: 'Development Server'
        },
        {
            url: 'https://api.pchr.com/api/v1',
            description: 'Production Server'
        }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string', example: 'UNAUTHORIZED' },
                                message: { type: 'string', example: 'Invalid token' },
                                statusCode: { type: 'integer', example: 401 }
                            }
                        },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'object' },
                        message: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                }
            }
        },
        security: [
        {
            bearerAuth: []
        }
        ],
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Patients', description: 'Patient management' },
            { name: 'Records', description: 'Medical records' },
            { name: 'Transfers', description: 'Record transfers' },
            { name: 'Files', description: 'File uploads' },
            { name: 'Notifications', description: 'User notifications' },
            { name: 'Dashboard', description: 'Analytics & statistics' },
            { name: 'Export', description: 'Data export' },
            { name: 'Tenants', description: 'Multi-tenant management' }
        ]
    },
    apis: ['./src/routes/v1/*.js', './src/models/*.js'] // Path to API docs
};

export const swaggerSpec = swaggerJsdoc(options);