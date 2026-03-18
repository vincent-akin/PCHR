import mongoose from 'mongoose';

export const AuditActions = {
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  TOKEN_REFRESH: 'token_refresh',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  
  // Patient actions
  PATIENT_CREATED: 'patient_created',
  PATIENT_UPDATED: 'patient_updated',
  PATIENT_VIEWED: 'patient_viewed',
  PATIENT_DELETED: 'patient_deleted',
  PATIENT_MERGED: 'patient_merged',
  
  // Record actions
  RECORD_CREATED: 'record_created',
  RECORD_UPDATED: 'record_updated',
  RECORD_VIEWED: 'record_viewed',
  RECORD_DELETED: 'record_deleted',
  RECORD_AMENDED: 'record_amended',
  RECORD_EXPORTED: 'record_exported',
  RECORD_PRINTED: 'record_printed',
  
  // Transfer actions
  TRANSFER_REQUESTED: 'transfer_requested',
  TRANSFER_APPROVED: 'transfer_approved',
  TRANSFER_REJECTED: 'transfer_rejected',
  TRANSFER_COMPLETED: 'transfer_completed',
  TRANSFER_CANCELLED: 'transfer_cancelled',
  TRANSFER_VIEWED: 'transfer_viewed',
  
  // File actions
  FILE_UPLOADED: 'file_uploaded',
  FILE_DOWNLOADED: 'file_downloaded',
  FILE_DELETED: 'file_deleted',
  FILE_VIEWED: 'file_viewed',
  
  // User actions
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_DEACTIVATED: 'user_deactivated',
  USER_ACTIVATED: 'user_activated',
  
  // Tenant actions
  TENANT_CREATED: 'tenant_created',
  TENANT_UPDATED: 'tenant_updated',
  TENANT_CONFIGURED: 'tenant_configured',
  
  // System actions
  SYSTEM_ERROR: 'system_error',
  API_ACCESS: 'api_access',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  BACKUP_CREATED: 'backup_created',
  BACKUP_RESTORED: 'backup_restored'
};

const auditLogSchema = new mongoose.Schema({
  // Who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userRole: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: String,
  
  // What action was performed
  action: {
    type: String,
    enum: Object.values(AuditActions),
    required: true,
    index: true
  },
  
  // On what resource
  resourceType: {
    type: String,
    required: true,
    enum: ['user', 'patient', 'record', 'transfer', 'file', 'tenant', 'system'],
    index: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  resourceName: String,
  
  // Where it happened
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  requestId: String, // For tracing requests
  
  // When it happened
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Additional context
  description: String,
  changes: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Status
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  errorDetails: String,
  
  // Compliance
  consentId: String, // If action required patient consent
  legalBasis: String, // GDPR/legal basis for processing
  dataCategories: [String] // Categories of data accessed
}, {
  timestamps: true,
  // Optimize for write-heavy workload
  collection: 'audit_logs'
});

// Compound indexes for common queries
auditLogSchema.index({ tenantId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });

// TTL index for automatic log rotation (keep logs for 7 years for healthcare compliance)
// REMOVED THE DUPLICATE - This one is sufficient
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 220752000 }); // 7 years

// Method to create audit entry
auditLogSchema.statics.log = async function({
  userId,
  userRole,
  userEmail,
  userName,
  action,
  resourceType,
  resourceId,
  resourceName,
  tenantId,
  ipAddress,
  userAgent,
  requestId,
  description,
  changes,
  metadata,
  status = 'success',
  errorDetails,
  consentId,
  legalBasis,
  dataCategories
}) {
  return this.create({
    userId,
    userRole,
    userEmail,
    userName,
    action,
    resourceType,
    resourceId,
    resourceName,
    tenantId,
    ipAddress,
    userAgent,
    requestId,
    description,
    changes,
    metadata,
    status,
    errorDetails,
    consentId,
    legalBasis,
    dataCategories,
    timestamp: new Date()
  });
};

// Static method to search audit logs
auditLogSchema.statics.search = function(filters = {}, pagination = {}) {
  const query = this.find(filters);
  
  if (pagination.limit) {
    query.limit(pagination.limit);
  }
  
  if (pagination.skip) {
    query.skip(pagination.skip);
  }
  
  if (pagination.sortBy) {
    query.sort({ [pagination.sortBy]: pagination.sortOrder || -1 });
  } else {
    query.sort({ timestamp: -1 });
  }
  
  return query.populate('userId', 'name email').exec();
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;