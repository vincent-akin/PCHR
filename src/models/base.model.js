import mongoose from 'mongoose';

const baseSchemaOptions = {
  timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.passwordHash; // Never send password in responses
            return ret;
        }
    }
    };

export const createBaseSchema = (fields, options = {}) => {
    return new mongoose.Schema(
        {
        ...fields,
        // Add tenantId to EVERY schema for multi-tenancy
            tenantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Tenant',
                required: true,
                index: true
            },
        // Soft delete flag
            isDeleted: {
                type: Boolean,
                default: false,
                index: true
            },
        // Who created/updated this record
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            updatedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        },
        { ...baseSchemaOptions, ...options }
    );
};

export default createBaseSchema;