import mongoose from 'mongoose';
import createBaseSchema from './base.model.js';

// Blood groups enum
export const BloodGroups = {
    A_POSITIVE: 'A+',
    A_NEGATIVE: 'A-',
    B_POSITIVE: 'B+',
    B_NEGATIVE: 'B-',
    AB_POSITIVE: 'AB+',
    AB_NEGATIVE: 'AB-',
    O_POSITIVE: 'O+',
    O_NEGATIVE: 'O-',
    UNKNOWN: 'unknown'
};

// Gender enum
export const Genders = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
    PREFER_NOT_TO_SAY: 'prefer_not_to_say'
};

const patientSchemaFields = {
  // Basic Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters'],
        index: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters'],
        index: true
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    gender: {
        type: String,
        enum: Object.values(Genders),
        required: [true, 'Gender is required']
    },

  // Contact Information
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: { type: String, default: 'Nigeria' }
    },
    
  // Emergency Contact
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    
    // Medical Information
    bloodGroup: {
        type: String,
        enum: Object.values(BloodGroups),
        default: BloodGroups.UNKNOWN
    },
    allergies: [{
        type: String,
        trim: true
    }],
    chronicConditions: [{
        type: String,
        trim: true
    }],
    currentMedications: [{
        name: String,
        dosage: String,
        frequency: String,
        prescribedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        prescribedDate: Date
    }],
    
  // Identification Numbers
    nationalId: {
        type: String,
        sparse: true,
        unique: true,
        trim: true
    },
    hospitalId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    
  // Insurance Information
    insuranceProvider: String,
    insuranceNumber: String,
    insuranceExpiryDate: Date,
    
    // Status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    // Additional Information
    occupation: String,
    maritalStatus: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed']
    },
    
    // Metadata
    profilePhoto: String,
    notes: String
};

const patientSchema = createBaseSchema(patientSchemaFields, {
    indexes: [
        { firstName: 1, lastName: 1 },
        { hospitalId: 1, tenantId: 1 },
        { nationalId: 1 },
        { phone: 1 },
        { email: 1 },
        { dateOfBirth: 1 },
        { isActive: 1 }
    ]
});

// Virtual for full name
patientSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Method to calculate age
patientSchema.methods.getAge = function() {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};

// Method to return patient summary
patientSchema.methods.toSummaryJSON = function() {
    return {
        id: this._id,
        fullName: this.fullName,
        dateOfBirth: this.dateOfBirth,
        age: this.getAge(),
        gender: this.gender,
        phone: this.phone,
        bloodGroup: this.bloodGroup,
        hospitalId: this.hospitalId,
        isActive: this.isActive
    };
};

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;