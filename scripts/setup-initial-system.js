import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Tenant from '../src/models/Tenant.js';
import User from '../src/models/User.js';
import { UserRoles } from '../src/models/User.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const setupInitialSystem = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create a Tenant (Hospital/Institution)
    console.log('📝 Step 1: Creating tenant...');
    
    let tenant = await Tenant.findOne({ name: 'Main Teaching Hospital' });
    
    if (!tenant) {
      tenant = await Tenant.create({
        name: 'Main Teaching Hospital',
        type: 'hospital',
        email: 'admin@mainhospital.com',
        phone: '+2341234567890',
        registrationNumber: 'HOSP001',
        status: 'active',
        config: {
          maxStorageGB: 500,
          maxUsers: 200,
          maxPatients: 50000,
          features: {
            telemedicine: true,
            labIntegration: true,
            billing: true,
            analytics: true
          }
        }
      });
      console.log('✅ Tenant created:', tenant.name);
      console.log('   Tenant ID:', tenant._id.toString());
    } else {
      console.log('⚠️  Tenant already exists:', tenant.name);
      console.log('   Tenant ID:', tenant._id.toString());
    }

    // Step 2: Create Admin User for this Tenant
    console.log('\n📝 Step 2: Creating admin user...');
    
    const adminEmail = 'admin@mainhospital.com';
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      adminUser = await User.create({
        name: 'System Administrator',
        email: adminEmail,
        passwordHash: hashedPassword,
        role: UserRoles.ADMIN,
        tenantId: tenant._id,
        isActive: true,
        phoneNumber: '+2341234567890'
      });
      console.log('✅ Admin user created:', adminUser.email);
      console.log('   Password: Admin123!');
    } else {
      console.log('⚠️  Admin user already exists:', adminUser.email);
    }

    // Step 3: Create a Doctor User
    console.log('\n📝 Step 3: Creating doctor user...');
    
    const doctorEmail = 'dr.sarah@mainhospital.com';
    let doctorUser = await User.findOne({ email: doctorEmail });
    
    if (!doctorUser) {
      const hashedPassword = await bcrypt.hash('Doctor123!', 10);
      
      doctorUser = await User.create({
        name: 'Dr. Sarah Johnson',
        email: doctorEmail,
        passwordHash: hashedPassword,
        role: UserRoles.DOCTOR,
        tenantId: tenant._id,
        isActive: true,
        specialization: 'Cardiology',
        licenseNumber: 'MED12345',
        phoneNumber: '+2348023456789'
      });
      console.log('✅ Doctor user created:', doctorUser.email);
      console.log('   Password: Doctor123!');
    } else {
      console.log('⚠️  Doctor user already exists:', doctorUser.email);
    }

    // Step 4: Create a Nurse User
    console.log('\n📝 Step 4: Creating nurse user...');
    
    const nurseEmail = 'nurse.jane@mainhospital.com';
    let nurseUser = await User.findOne({ email: nurseEmail });
    
    if (!nurseUser) {
      const hashedPassword = await bcrypt.hash('Nurse123!', 10);
      
      nurseUser = await User.create({
        name: 'Jane Smith',
        email: nurseEmail,
        passwordHash: hashedPassword,
        role: UserRoles.NURSE,
        tenantId: tenant._id,
        isActive: true,
        licenseNumber: 'NUR12345',
        phoneNumber: '+2348034567890'
      });
      console.log('✅ Nurse user created:', nurseUser.email);
      console.log('   Password: Nurse123!');
    } else {
      console.log('⚠️  Nurse user already exists:', nurseUser.email);
    }

    // Summary
    console.log('\n🎉 System Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   Tenant: ${tenant.name} (ID: ${tenant._id})`);
    console.log(`   Admin: admin@mainhospital.com / Admin123!`);
    console.log(`   Doctor: dr.sarah@mainhospital.com / Doctor123!`);
    console.log(`   Nurse: nurse.jane@mainhospital.com / Nurse123!`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Tip: Use the admin credentials to login and manage the system.');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📌 Disconnected from MongoDB');
  }
};

setupInitialSystem();