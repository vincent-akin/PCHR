import mongoose from 'mongoose';
import createBaseSchema from './base.model.js';

export const TransferStatus = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired'
};

export const TransferTypes = {
    FULL_RECORD: 'full_record',
    SUMMARY_ONLY: 'summary_only',
    SELECTED_RECORDS: 'selected_records'
};

const transferSchemaFields = {
  // Core fields
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient ID is required'],
        index: true
    },
    
    // Tenants involved
    fromTenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: [true, 'Source tenant is required'],
        index: true
    },
    toTenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: [true, 'Destination tenant is required'],
        index: true
    },
    
    // Transfer details
    type: {
        type: String,
        enum: Object.values(TransferTypes),
        default: TransferTypes.FULL_RECORD
    },
    status: {
        type: String,
        enum: Object.values(TransferStatus),
        default: TransferStatus.PENDING,
        index: true
    },
    
    // Request details
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Requestor ID is required']
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    requestNotes: String,
    
    // Approval details
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    approvalNotes: String,
    
    // Rejection details
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectedAt: Date,
    rejectionReason: String,
    
    // Completion details
    completedAt: Date,
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Patient consent
    patientConsent: {
        obtained: { type: Boolean, default: false },
            obtainedAt: Date,
            consentDocument: String, // URL to signed consent form
        consentMethod: {
            type: String,
            enum: ['written', 'digital', 'verbal']
        }
    },
    
    // Records to transfer (if selective)
    selectedRecords: [{
        recordId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MedicalRecord'
        },
            included: Boolean,
            reason: String // reason if excluded
    }],
    
    // Date range for transfer
    dateRange: {
        from: Date,
        to: Date
    },
    
    // Transfer metadata
    transferCode: {
        type: String,
        unique: true,
        sparse: true
    },
    purpose: String, // e.g., "emergency care", "second opinion", "patient move"
    
    // Security
    encryptionKey: String, // For encrypting transferred data
    accessPin: String, // Optional PIN for additional security
    
    // Expiry
    expiresAt: Date,
    
  // Audit
    viewedByDestination: [{
        userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        },
        viewedAt: Date
    }]
};

const transferSchema = createBaseSchema(transferSchemaFields, {
    indexes: [
        { fromTenant: 1, status: 1 },
        { toTenant: 1, status: 1 },
        { patientId: 1, status: 1 },
        { requestedAt: -1 },
        { expiresAt: 1 },
        { transferCode: 1 }
    ]
});

// Generate transfer code before saving
transferSchema.pre('save', async function(next) {
    if (!this.transferCode) {
        // Generate unique transfer code: TR-YYYYMMDD-XXXX
        const date = new Date();
        const dateStr = date.toISOString().slice(0,10).replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        this.transferCode = `TR-${dateStr}-${random}`;
    }
    
  // Set expiry if not set (default 30 days)
    if (!this.expiresAt) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        this.expiresAt = expiryDate;
    }
    
    next();
});

// Method to check if transfer is expired
transferSchema.methods.isExpired = function() {
    return this.expiresAt && new Date() > this.expiresAt;
};

// Method to approve transfer
transferSchema.methods.approve = async function(userId, notes) {
    this.status = TransferStatus.APPROVED;
    this.approvedBy = userId;
    this.approvedAt = new Date();
    this.approvalNotes = notes;
    return this.save();
};

// Method to reject transfer
transferSchema.methods.reject = async function(userId, reason) {
    this.status = TransferStatus.REJECTED;
    this.rejectedBy = userId;
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
    return this.save();
};

// Method to complete transfer
transferSchema.methods.complete = async function(userId) {
    this.status = TransferStatus.COMPLETED;
    this.completedBy = userId;
    this.completedAt = new Date();
    return this.save();
};

const Transfer = mongoose.model('Transfer', transferSchema);

export default Transfer;