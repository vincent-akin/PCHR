import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const testUpload = async () => {
    try {
            // First, login to get token
            console.log('🔐 Logging in...');
            const loginRes = await fetch('http://localhost:8000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@system.com',
                password: 'Admin123!'
            })
        });
    
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    console.log('✅ Logged in, token received\n');
    
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-image.jpg');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('patientId', 'PATIENT_ID_HERE');
    formData.append('category', 'scan');
    formData.append('description', 'Test medical image');
    formData.append('tags', JSON.stringify(['test', 'x-ray']));
    
    // Upload file
    console.log('📤 Uploading file...');
    const uploadRes = await fetch('http://localhost:8000/api/v1/files/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...formData.getHeaders()
        },
        body: formData
    });
    
    const uploadData = await uploadRes.json();
    console.log('✅ File uploaded:', uploadData.data.fileName);
    console.log('   ID:', uploadData.data._id);
    console.log('   Size:', uploadData.data.fileSize, 'bytes');
    
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testUpload();