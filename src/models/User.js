import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { createBaseSchema } from "./base.model.js";


//Define user role from PRD
export const UserRoles = {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    PATIENT: 'patient',
    NURSE: 'nurse',
    LAB_TECHNICIAN: 'lab_technician',
    
}

const userSchemaFields = {
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength: [100, "Name cannot be more than 100 characters"]
    },

    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },

    passwordHash: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"],
        select: false // Exclude passwordHash from query results by default
    },

    role: {
        type: String,
        enum: Object.values(UserRoles),
        default: UserRoles.PATIENT,
        required: [true, "Role is required"],
        index: true // Add index for faster queries on role
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
    if (!this.isModified('passwordHash')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (error) {
        next(error);
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
