import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Tenant from '../src/models/Tenant.js';
import User from '../src/models/User.js';
import { UserRoles } from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const createInitialTenant = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Create initial tenant
        const existingTenant = await Tenant.findOne({ name: 'System Admin' });
        
        if (!existingTenant) {
        const tenant = await Tenant.create({
            name: 'System Admin',
            type: 'hospital',
            email: 'admin@pchr.com',
            phone: '+1234567890',
            registrationNumber: 'SYS001',
            status: 'active',
            config: {
            maxStorageGB: 1000,
            maxUsers: 100,
            maxPatients: 10000,
            features: {
                telemedicine: true,
                labIntegration: true,
                billing: true,
                analytics: true
            }
            },
            subscription: {
            plan: 'enterprise',
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            autoRenew: true
            }
        });
        console.log('✅ Tenant created:', tenant.name);
        console.log('   ID:', tenant._id.toString());
        
        // Create admin user for this tenant
        const adminUser = await User.create({
            name: 'System Administrator',
            email: 'admin@system.com',
            passwordHash: 'Admin123!',
            role: UserRoles.ADMIN,
            tenantId: tenant._id,
            isActive: true
        });
        console.log('✅ Admin user created:', adminUser.email);
        console.log('   Password: Admin123!');
        } else {
        console.log('⚠️  Tenant already exists');
        }

        console.log('\n🎉 Setup completed!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

createInitialTenant();