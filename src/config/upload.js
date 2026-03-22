import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File size limits (20MB)
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Allowed file types
export const ALLOWED_MIME_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf'],
    'application/dicom': ['.dcm'],
    'image/dicom': ['.dcm'],
    'image/tiff': ['.tiff', '.tif'],
    'image/bmp': ['.bmp'],
    'text/plain': ['.txt'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

// Storage configuration
const storage = multer.memoryStorage(); // Store in memory for processing

// File filter
export const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
};

// Multer upload configuration
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: fileFilter
});

// Generate unique filename
export const generateFileName = (originalName, mimeType) => {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const cleanName = path.basename(originalName, extension)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
    
    return `${cleanName}-${timestamp}-${random}${extension}`;
};