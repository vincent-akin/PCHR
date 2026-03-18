import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models from src
import { 
  User, 
  Patient, 
  MedicalRecord, 
  Transfer, 
  AuditLog, 
  Tenant,
  UserRoles,
  BloodGroups,
  Genders,
  RecordTypes,
  TransferStatus
} from '../src/models/index.js';

const testModels = async () => {
  console.log('🚀 Starting model tests...\n');
  
  try {
    // Check MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env file');
    }
    console.log('📡 MongoDB URI found:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing test data (optional - be careful!)
    console.log('🧹 Clearing existing test data...');
    await Tenant.deleteMany({ name: 'Test Hospital' });
    await User.deleteMany({ email: 'doctor@test.com' });
    await Patient.deleteMany({ email: 'john.doe@email.com' });
    console.log('✅ Test data cleared\n');

    // 1. Create a Tenant
    console.log('📝 Creating test tenant...');
    const tenant = await Tenant.create({
      name: 'Test Hospital',
      type: 'hospital',
      email: 'test@hospital.com',
      phone: '+234123456789',
      registrationNumber: 'REG12345',
      config: {
        maxStorageGB: 100,
        maxUsers: 50,
        features: {
          telemedicine: true,
          labIntegration: true
        }
      },
      subscription: {
        plan: 'professional',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      }
    });
    console.log('✅ Tenant created:', tenant.name);
    console.log('   ID:', tenant._id.toString());
    console.log('   Status:', tenant.status);
    console.log('');

    // 2. Create a User (Doctor)
    console.log('📝 Creating test doctor...');
    const doctor = await User.create({
      name: 'Dr. Test Doctor',
      email: 'doctor@test.com',
      passwordHash: 'Test123!', // Will be hashed by pre-save hook
      role: UserRoles.DOCTOR,
      tenantId: tenant._id,
      specialization: 'Cardiology',
      licenseNumber: 'MED12345',
      phoneNumber: '+2347012345678',
      isActive: true
    });
    console.log('✅ Doctor created:', doctor.name);
    console.log('   ID:', doctor._id.toString());
    console.log('   Role:', doctor.role);
    console.log('   Email:', doctor.email);
    console.log('');

    // 3. Create a Patient
    console.log('📝 Creating test patient...');
    const patient = await Patient.create({
      tenantId: tenant._id,
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-01-15'),
      gender: Genders.MALE,
      phone: '+2347012345678',
      email: 'john.doe@email.com',
      address: {
        street: '123 Test Street',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria'
      },
      bloodGroup: BloodGroups.O_POSITIVE,
      allergies: ['Penicillin', 'Peanuts'],
      chronicConditions: ['Hypertension'],
      hospitalId: 'HOSP001',
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Wife',
        phone: '+2347012345679'
      },
      createdBy: doctor._id
    });
    console.log('✅ Patient created:', patient.fullName);
    console.log('   ID:', patient._id.toString());
    console.log('   Age:', patient.getAge(), 'years');
    console.log('   Blood Group:', patient.bloodGroup);
    console.log('');

    // 4. Create a Medical Record
    console.log('📝 Creating medical record...');
    const record = await MedicalRecord.create({
      patientId: patient._id,
      doctorId: doctor._id,
      tenantId: tenant._id,
      type: RecordTypes.CONSULTATION,
      title: 'Initial Cardiology Consultation',
      description: 'First visit for chest pain evaluation',
      notes: 'Patient reports occasional chest pain when exercising. BP slightly elevated. Recommended lifestyle changes and prescribed medication.',
      vitalSigns: {
        bloodPressure: { systolic: 135, diastolic: 85 },
        heartRate: 78,
        temperature: 36.8,
        weight: 75.5,
        height: 175,
        bmi: 24.7
      },
      diagnosis: [{
        code: 'I10',
        description: 'Essential (primary) hypertension',
        isPrimary: true
      }],
      medications: [{
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'once daily',
        route: 'oral',
        instructions: 'Take in the morning with food',
        prescribedDate: new Date()
      }],
      followUpRequired: true,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
      followUpInstructions: 'Return for BP check and medication review',
      createdBy: doctor._id,
      doctorSignature: {
        signed: true,
        signedAt: new Date(),
        signedBy: doctor._id
      }
    });
    console.log('✅ Medical record created:', record.title);
    console.log('   ID:', record._id.toString());
    console.log('   Type:', record.type);
    console.log('   Status:', record.status);
    console.log('');

    // 5. Create a Transfer request
console.log('📝 Creating record transfer request...');
const transfer = await Transfer.create({
  patientId: patient._id,
  fromTenant: tenant._id,
  toTenant: tenant._id,
  tenantId: tenant._id, // IMPORTANT: Add this for the base schema
  requestedBy: doctor._id,
  requestNotes: 'Transfer for specialist review',
  patientConsent: {
    obtained: true,
    obtainedAt: new Date(),
    consentMethod: 'digital'
  },
  purpose: 'specialist_consultation',
  selectedRecords: [{
    recordId: record._id,
    included: true,
    reason: 'Cardiology consultation needed'
  }]
});
console.log('✅ Transfer created:', transfer.transferCode);
console.log('   Status:', transfer.status);
console.log('   Expires:', transfer.expiresAt.toLocaleDateString());
console.log('');

    // 6. Create an Audit Log entry
    console.log('📝 Creating audit log...');
    const audit = await AuditLog.log({
      userId: doctor._id,
      userRole: doctor.role,
      userEmail: doctor.email,
      userName: doctor.name,
      action: 'patient_viewed',
      resourceType: 'patient',
      resourceId: patient._id,
      resourceName: patient.fullName,
      tenantId: tenant._id,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Script',
      description: 'Test audit log entry for patient record access',
      metadata: { 
        test: true,
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Audit log created:');
    console.log('   Action:', audit.action);
    console.log('   ID:', audit._id.toString());
    console.log('');

    // 7. Query examples
    console.log('🔍 Running Query Examples:');
    console.log('------------------------');
    
    // Find patient with their records
    const patientWithRecords = await Patient.findById(patient._id);
    const patientRecords = await MedicalRecord.find({ patientId: patient._id });
    console.log(`   📊 Patient ${patientWithRecords.fullName} has ${patientRecords.length} record(s)`);
    
    // Find doctor's patients
    const doctorsPatients = await MedicalRecord.distinct('patientId', { doctorId: doctor._id });
    console.log(`   👨‍⚕️ Doctor ${doctor.name} has treated ${doctorsPatients.length} patient(s)`);
    
    // Find pending transfers
    const pendingTransfers = await Transfer.countDocuments({ status: TransferStatus.PENDING });
    console.log(`   🔄 There are ${pendingTransfers} pending transfer(s)`);
    
    // Calculate patient age
    console.log(`   🎂 Patient age: ${patient.getAge()} years`);
    
    // Find recent audit logs
    const recentAudits = await AuditLog.countDocuments({ 
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    console.log(`   📋 Recent audit logs (24h): ${recentAudits}`);
    
    // Check tenant stats
    const tenantStats = await Tenant.findById(tenant._id);
    console.log(`   🏥 Tenant ${tenantStats.name} has ${tenantStats.usage.patientCount || 0} patients`);
    
    console.log('\n------------------------\n');

    // 8. Test model methods
    console.log('🧪 Testing Model Methods:');
    console.log('------------------------');
    
    // Test password comparison
    const passwordValid = await doctor.comparePassword('Test123!');
    console.log(`   🔐 Password validation: ${passwordValid ? '✅' : '❌'}`);
    
    // Test patient summary
    const patientSummary = patient.toSummaryJSON();
    console.log(`   📄 Patient summary: ${patientSummary.fullName}, Age: ${patientSummary.age}`);
    
    // Test transfer approval
    console.log('   📤 Testing transfer approval...');
    await transfer.approve(doctor._id, 'Approved for testing');
    console.log(`   ✅ Transfer status after approval: ${transfer.status}`);
    
    // Test isExpired method
    console.log(`   ⏰ Transfer expired? ${transfer.isExpired() ? 'Yes' : 'No'}`);
    
    console.log('------------------------\n');

    console.log('🎉✅ All model tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Tenant: ${tenant.name}`);
    console.log(`   • Users: 1 (Doctor)`);
    console.log(`   • Patients: 1`);
    console.log(`   • Records: 1`);
    console.log(`   • Transfers: 1`);
    console.log(`   • Audit Logs: 1`);

  } catch (error) {
    console.error('\n❌❌❌ Test failed:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('\n📌 Disconnected from MongoDB');
  }
};

// Run the tests
testModels();