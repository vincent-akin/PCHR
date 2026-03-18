# Patient Clinical Health Record Platform (PCHR)

# Backend System Design Document (SDD)

**Project:** Patient Clinical Health Record Platform
**Component:** Backend API
**Version:** 1.0
**API Version:** v1
**Stack:** Node.js, Express.js, MongoDB
**Last Updated:** March 2026
**Document Owner:** Backend Engineering Team

---

# 1. System Overview

The **PCHR backend** provides a secure API platform for managing, storing, and transferring patient clinical records between healthcare institutions.

The system supports:

- Multi-hospital data isolation
- Secure record storage
- Clinical file uploads
- Inter-facility data transfers
- Regulatory audit logs

The backend is built using:

- **Node.js**
- **Express.js**
- **MongoDB**
- **Cloud Object Storage**

---

# 2. High-Level System Architecture

```
Client Applications
(Web / Mobile / Hospital Systems)

        │
        │ HTTPS
        ▼

API Gateway
(Express.js)

        │
        ▼

Application Services
(Auth / Patients / Records / Transfers)

        │
        ▼

Domain Layer
(Business Logic)

        │
        ▼

Repository Layer
(Database Access)

        │
        ▼

MongoDB Cluster
(Primary + Replica)

        │
        ▼

Cloud Object Storage
(S3 / R2 / Azure Blob)
```

---

# 3. Backend Project Structure

```
pchr-backend/
│
├── src/                          # Source code
│   ├── controllers/              # Route handlers
│   ├── services/                 # Business logic
│   ├── repositories/             # Database access
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js
│   │   ├── Patient.js
│   │   ├── MedicalRecord.js
│   │   ├── Transfer.js
│   │   ├── AuditLog.js
│   │   ├── File.js
│   │   ├── Tenant.js
│   │   └── index.js
│   ├── middlewares/              # Express middlewares
│   ├── validators/               # Request validation
│   ├── routes/                   # API routes
│   ├── events/                   # Event handlers
│   ├── config/                   # Configuration
│   │   ├── config.js
│   │   └── database.js
│   ├── utils/                    # Utilities
│   │   ├── httpStatus.js
│   │   ├── ApiError.js
│   │   ├── apiResponse.js
│   │   └── asyncHandler.js
│   ├── app.js                    # Express app
│   └── server.js                 # Server entry point
│
├── scripts/                       # Utility scripts (AT ROOT LEVEL)
│   └── test-models.js            # Test script for models
│
├── tests/                          # Test files
│   ├── unit/                      # Unit tests
│   └── integration/                # Integration tests
│
├── node_modules/                   # Dependencies
│
├── .env                            # Environment variables (NOT committed)
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore file
├── .eslintrc.json                  # ESLint configuration
├── .prettierrc                     # Prettier configuration
├── nodemon.json                     # Nodemon configuration
├── package.json                     # Project dependencies and scripts
├── package-lock.json                # Locked dependencies
└── README.md                        # Project documentation
```

---

# 4. Request Lifecycle

Typical API request flow:

```
Client Request
      │
      ▼
Route
      │
      ▼
Middleware
(Auth / Rate Limit / Validation)
      │
      ▼
Controller
      │
      ▼
Service
      │
      ▼
Repository
      │
      ▼
MongoDB
      │
      ▼
Response
```

---

# 5. Authentication Design

The platform uses **JWT-based authentication**.

---

## Authentication Flow

```
User Login
     │
     ▼
Auth Service
     │
     ▼
Verify Credentials
     │
     ▼
Generate Access Token
     │
     ▼
Generate Refresh Token
     │
     ▼
Return Tokens
```

---

## JWT Payload

```
{
  userId,
  role,
  tenantId
}
```

---

## Token Policy

| Token         | Lifetime   |
| ------------- | ---------- |
| Access Token  | 15 minutes |
| Refresh Token | 7 days     |

---

# 6. Authorization Model

Role-based access control.

| Role           | Permissions         |
| -------------- | ------------------- |
| Admin          | Full access         |
| Doctor         | Manage records      |
| Nurse          | Update patient data |
| Lab Technician | Upload lab results  |
| Patient        | View own records    |

Authorization middleware checks:

```
req.user.role
```

---

# 7. Multi-Tenant Data Isolation

Each hospital is treated as a **tenant**.

Every database document includes:

```
tenantId
```

Example:

```
Patient
 └── tenantId

Record
 └── tenantId

User
 └── tenantId
```

Middleware enforces:

```
req.user.tenantId === resource.tenantId
```

This prevents cross-hospital data access.

---

# 8. Database Design

## MongoDB Collections

```
users
patients
records
transfers
files
audit_logs
```

---

# 9. Database Schemas

---

# 9.1 User Schema

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  passwordHash: String,
  role: String,
  tenantId: ObjectId,
  createdAt: Date
}
```

Indexes:

```
email (unique)
tenantId
```

---

# 9.2 Patient Schema

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: String,
  phone: String,
  address: String,
  bloodGroup: String,
  allergies: [String],
  createdBy: ObjectId,
  createdAt: Date
}
```

Indexes:

```
tenantId
lastName
```

---

# 9.3 Medical Record Schema

```javascript
{
  _id: ObjectId,
  patientId: ObjectId,
  doctorId: ObjectId,
  tenantId: ObjectId,
  type: String,
  notes: String,
  attachments: [String],
  createdAt: Date
}
```

Indexes:

```
patientId
tenantId
```

---

# 9.4 Transfer Schema

```javascript
{
  _id: ObjectId,
  patientId: ObjectId,
  fromTenant: ObjectId,
  toTenant: ObjectId,
  status: String,
  requestedBy: ObjectId,
  approvedBy: ObjectId,
  createdAt: Date
}
```

---

# 9.5 Audit Log Schema

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  action: String,
  resourceType: String,
  resourceId: ObjectId,
  ipAddress: String,
  timestamp: Date
}
```

---

# 10. File Storage Architecture

Medical documents are stored in **cloud object storage**.

Workflow:

```
Upload Request
     │
     ▼
API Server
     │
     ▼
File Validation
     │
     ▼
Upload to Cloud Storage
     │
     ▼
Save Metadata in MongoDB
```

File metadata schema:

```
fileId
patientId
recordId
url
size
uploadedBy
createdAt
```

---

# 11. Record Transfer Design

The record transfer system allows hospitals to securely share patient records.

---

## Transfer Workflow

```
Hospital A initiates transfer
        │
        ▼
Patient consent verified
        │
        ▼
Transfer request created
        │
        ▼
Hospital B reviews request
        │
        ▼
Approve / Reject
        │
        ▼
Records shared
```

---

# 12. Event System

Certain system actions trigger events.

Examples:

```
patient_created
record_uploaded
transfer_requested
transfer_approved
```

Events may trigger:

- notifications
- analytics
- audit logging

Implementation options:

```
Redis Pub/Sub
RabbitMQ
Kafka
```

---

# 13. Rate Limiting

API abuse protection.

Example limits:

```
100 requests/min per user
```

Using:

```
express-rate-limit
```

---

# 14. Observability

---

## Logging

Structured logging using:

```
Winston
Pino
Morgan
```

Log types:

- request logs
- error logs
- audit logs

---

## Metrics

Monitor:

- API latency
- error rates
- database query times
- system load

Tools:

```
Prometheus
Grafana
```

---

# 15. Error Handling

Centralized error middleware.

Example error response:

```
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  }
}
```

---

# 16. Scalability Strategy

---

## Horizontal Scaling

```
Multiple Node.js instances
```

Behind:

```
NGINX
Cloud Load Balancer
```

---

## Database Scaling

MongoDB supports:

```
Replica Sets
Sharding
```

---

## Caching

Recommended caching layer:

```
Redis
```

Use cases:

- session cache
- frequently accessed patient data

---

# 17. Deployment Architecture

Production environment:

```
Client Apps
      │
      ▼
Cloud Load Balancer
      │
      ▼
NGINX Gateway
      │
      ▼
Node.js API Servers
      │
      ▼
MongoDB Atlas
      │
      ▼
Cloud Storage
```

---

# 18. CI/CD Pipeline

```
GitHub Repository
      │
      ▼
GitHub Actions
      │
      ▼
Docker Build
      │
      ▼
Deploy to Cloud
```

---

# 19. Security Architecture

Security measures include:

- TLS encryption
- JWT authentication
- Role-based access control
- Tenant data isolation
- Encrypted storage
- Audit logs

Sensitive fields may be encrypted using:

```
AES-256
```

---

# 20. Disaster Recovery

Backup strategies:

- MongoDB daily snapshots
- Cloud storage redundancy
- Multi-region backups

Recovery time objective:

```
RTO < 1 hour
```

---

# 21. Future Architecture Improvements

Potential upgrades:

### Microservices

Split services:

```
Auth Service
Patient Service
Record Service
Transfer Service
```

---

### Healthcare Standards

Support:

```
HL7 FHIR
```

for interoperability.

---

### AI Diagnostics

Integration with ML models for:

- disease detection
- imaging analysis

---

# 22. Engineering Standards

Code quality rules:

- ESLint
- Prettier
- Conventional commits
- Pull request reviews

---

# 23. Documentation

Documentation includes:

- PRD
- System Design Document
- API Documentation
- Deployment Guide
