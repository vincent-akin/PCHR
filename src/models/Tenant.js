import mongoose from 'mongoose';

export const TenantTypes = {
    HOSPITAL: 'hospital',
    CLINIC: 'clinic',
    LABORATORY: 'laboratory',
    PHARMACY: 'pharmacy',
    INSURANCE: 'insurance',
    GOVERNMENT: 'government'
};

export const TenantStatus = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    INACTIVE: 'inactive',
    PENDING: 'pending'
};

const tenantSchema = new mongoose.Schema({
  // Basic information
    name: {
        type: String,
        required: [true, 'Tenant name is required'],
        unique: true,
        trim: true,
        index: true
    },
    type: {
        type: String,
        enum: Object.values(TenantTypes),
        required: [true, 'Tenant type is required']
    },
    status: {
        type: String,
        enum: Object.values(TenantStatus),
        default: TenantStatus.ACTIVE,
        index: true
    },
    
  // Contact information
    email: {
        type: String,
        required: [true, 'Contact email is required'],
        lowercase: true
    },
    phone: String,
    website: String,
    
  // Address
    address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: { type: String, default: 'Nigeria' }
    },
    
  // Registration details
    registrationNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    taxId: String,
    licenseNumber: String,
    licenseExpiry: Date,
    
  // Configuration
    config: {
        // Storage limits
        maxStorageGB: { type: Number, default: 100 },
        maxUsers: { type: Number, default: 50 },
        maxPatients: { type: Number, default: 10000 },
    
        // Features enabled
        features: {
            telemedicine: { type: Boolean, default: false },
            labIntegration: { type: Boolean, default: false },
            billing: { type: Boolean, default: false },
            inventory: { type: Boolean, default: false },
            analytics: { type: Boolean, default: false }
        },
    
        // Custom branding
        branding: {
            logo: String,
            primaryColor: String,
            secondaryColor: String
        },
    
    // Security settings
        security: {
            mfaRequired: { type: Boolean, default: false },
            passwordPolicy: {
                minLength: { type: Number, default: 8 },
                requireUppercase: { type: Boolean, default: true },
                requireLowercase: { type: Boolean, default: true },
                requireNumbers: { type: Boolean, default: true },
                requireSymbols: { type: Boolean, default: false }
            },
        sessionTimeout: { type: Number, default: 30 } // minutes
        },
        
        // Notification settings
        notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        webhook: String
        }
    },

  // Subscription
    subscription: {
        plan: {
            type: String,
            enum: ['basic', 'professional', 'enterprise'],
            default: 'basic'
        },
        startDate: Date,
        endDate: Date,
        autoRenew: { type: Boolean, default: true },
        paymentMethod: String
    },
    
  // Usage statistics
    usage: {
        storageUsedGB: { type: Number, default: 0 },
        userCount: { type: Number, default: 0 },
        patientCount: { type: Number, default: 0 },
        recordCount: { type: Number, default: 0 },
        transferCount: { type: Number, default: 0 },
        lastUpdated: Date
    },

  // API keys for integration
    apiKeys: [{
        name: String,
        key: {
            type: String,
            select: false
        },
        permissions: [String],
        createdAt: Date,
        lastUsed: Date,
        expiresAt: Date
    }],

  // Audit
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
    }, {
    timestamps: true
});

// Indexes
tenantSchema.index({ status: 1, type: 1 });
tenantSchema.index({ 'subscription.endDate': 1 });
tenantSchema.index({ 'config.features': 1 });

// Method to check if tenant is active
tenantSchema.methods.isActive = function() {
    return this.status === TenantStatus.ACTIVE;
};

// Method to check if tenant has available storage
tenantSchema.methods.hasAvailableStorage = function(additionalGB = 0) {
    return (this.usage.storageUsedGB + additionalGB) <= this.config.maxStorageGB;
};

// Method to check if tenant can add more users
tenantSchema.methods.canAddUser = function() {
    return this.usage.userCount < this.config.maxUsers;
};

// Method to update usage statistics
tenantSchema.methods.updateUsage = async function(stats) {
    Object.assign(this.usage, stats);
    this.usage.lastUpdated = new Date();
    return this.save();
};

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;