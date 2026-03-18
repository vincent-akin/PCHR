# Patient Clinical Health Record Platform (PCHR) - Backend

Secure, scalable backend API for managing patient medical records across healthcare institutions.

## 🏗️ Architecture

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT-based with refresh tokens
- **Storage:** Cloud object storage (AWS S3/Cloudflare R2)
- **Multi-tenancy:** Hospital-level data isolation

## 📁 Project Structure

src/
├── controllers/ # Route handlers
├── services/ # Business logic
├── repositories/ # Database operations
├── models/ # Mongoose schemas
├── middlewares/ # Express middlewares
├── validators/ # Request validation
├── routes/ # API routes
├── events/ # Event handlers
├── config/ # Configuration
└── utils/ # Utilities

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and update values
4. Start MongoDB locally or use MongoDB Atlas
5. Run development server: `npm run dev`

## 📊 API Documentation

API documentation will be available at `/api/docs` when Swagger is configured.

## 🧪 Testing

- Run tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`

## 📝 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## 🔒 Security

- TLS encryption for all API traffic
- JWT-based authentication
- Role-based access control (RBAC)
- Multi-tenant data isolation
- Rate limiting protection
- Audit logging for compliance

## 📈 Monitoring

- Structured logging with Winston
- Request logging with Morgan
- Performance metrics (to be implemented)

## 🏥 Multi-tenancy

Each healthcare institution (hospital, clinic, lab) operates as a separate tenant with complete data isolation.

## 📋 Core Features

- User authentication & authorization
- Patient profile management
- Medical records storage
- Inter-hospital record transfers
- File uploads for medical images/documents
- Audit logging
- Role-based access control

## 🤝 Contributing

Please read our coding standards and submit pull requests for review.

## 📄 License

ISC

## PROJECT SUMMARY

**Database Models ✅**
Tenant Model - Multi-tenancy support for hospitals/clinics

User Model - With roles (Doctor, Admin, etc.) and password hashing

Patient Model - Complete patient profiles with medical info

MedicalRecord Model - Clinical documentation with diagnoses, medications, vitals

Transfer Model - Inter-hospital record transfers with approval workflow

AuditLog Model - Complete traceability for compliance

**Features Verified ✅**
🔐 Password hashing works correctly

🏥 Multi-tenancy isolation through tenantId

📊 Data relationships between models

🔄 Transfer workflow (create → approve)

📝 Audit logging for all actions

🎂 Age calculation from date of birth

📋 Query examples working properly _18TH MARCH 2026_
