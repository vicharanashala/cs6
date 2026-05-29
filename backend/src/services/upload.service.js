import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

// Setup multer memory storage (stores file in buffer)
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, PNG, and PDF files are allowed!'));
  }
});

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn('⚠️ Cloudinary credentials missing in .env. Falling back to Mock Upload Mode.');
}

/**
 * Upload file buffer to Cloudinary (or mock it if credentials are not configured)
 * @param {Buffer} fileBuffer 
 * @param {string} originalName 
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      // Return a simulated Cloudinary response
      const randomId = Math.random().toString(36).substring(2, 15);
      return resolve({
        url: `https://res.cloudinary.com/demo/image/upload/v1234567890/tickets/${randomId}_${originalName}`,
        publicId: `tickets/${randomId}_${originalName.split('.')[0]}`
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'tickets' },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete file from Cloudinary (or mock it)
 * @param {string} publicId 
 * @returns {Promise<boolean>}
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured) {
    return true;
  }
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary deletion failed:', error);
    return false;
  }
};
