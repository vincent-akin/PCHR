import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import createBaseSchema from './base.model.js';

// Define user roles from PRD
export const UserRoles = {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    NURSE: 'nurse',
    LAB_TECHNICIAN: 'lab_technician',
    PATIENT: 'patient'
};

const userSchemaFields = {
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        select: false // Don't return password by default in queries
    },
    role: {
        type: String,
        enum: Object.values(UserRoles),
        default: UserRoles.PATIENT,
        required: true,
        index: true
    },
    specialization: {
        type: String,
        trim: true,
        // Only required for doctors
        required: function() {
        return this.role === UserRoles.DOCTOR;
        }
    },
    licenseNumber: {
        type: String,
        trim: true,
        // Required for healthcare professionals
        required: function() {
            return [UserRoles.DOCTOR, UserRoles.NURSE, UserRoles.LAB_TECHNICIAN].includes(this.role);
        }
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastLogin: {
    type: Date
    },
    refreshToken: {
        type: String,
        select: false
    },
    passwordResetToken: String,
    passwordResetExpires: Date
};

const userSchema = createBaseSchema(userSchemaFields, {
  // Additional schema options
    indexes: [
        { email: 1 },
        { role: 1, tenantId: 1 },
        { isActive: 1 }
    ]
});

// Hash password before saving - FIXED VERSION (no next() parameter)
userSchema.pre('save', async function() {
  // Only hash if password is modified
    if (!this.isModified('passwordHash')) return;
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    } catch (error) {
        throw error; // Let Mongoose handle the error
    }
    });

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to return user without sensitive data
userSchema.methods.toProfileJSON = function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        tenantId: this.tenantId,
        specialization: this.specialization,
        phoneNumber: this.phoneNumber,
        isActive: this.isActive,
        lastLogin: this.lastLogin,
        createdAt: this.createdAt
    };
};

const User = mongoose.model('User', userSchema);

export default User;