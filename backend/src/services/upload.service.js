import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import crypto from 'crypto';
import { scanBuffer } from '../utils/clamav.js';

// ─── Multer Configuration ────────────────────────────────────────────────────
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

// ─── Cloudinary Configuration ────────────────────────────────────────────────
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

// ─── S3 Configuration ────────────────────────────────────────────────────────
const isS3Configured =
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET;

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || 'faq-portal-uploads';

/**
 * Generates an AWS Signature Version 4 presigned URL.
 * This is a lightweight native implementation — no AWS SDK dependency required.
 *
 * @param {'GET'|'PUT'} method - HTTP method
 * @param {string} key - The S3 object key (path)
 * @param {Object} [options] - Additional options
 * @param {string} [options.contentType] - Content-Type header for PUT requests
 * @param {number} [options.expiresIn=3600] - Seconds until URL expiry
 * @returns {string} Presigned URL
 */
const generatePresignedUrl = (method, key, options = {}) => {
  const { contentType, expiresIn = 3600 } = options;
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 8); // YYYYMMDD
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');               // YYYYMMDDTHHMMSSZ

  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const host = `${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
  const credentialScope = `${dateStamp}/${AWS_REGION}/s3/aws4_request`;
  const credential = `${accessKey}/${credentialScope}`;

  // Build canonical query string
  const queryParams = new Map([
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', credential],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(expiresIn)],
    ['X-Amz-SignedHeaders', 'host']
  ]);

  if (contentType) {
    queryParams.set('X-Amz-SignedHeaders', 'content-type;host');
  }

  // Sort query parameters alphabetically
  const sortedParams = [...queryParams.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const canonicalQueryString = sortedParams.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

  // Build canonical headers
  let canonicalHeaders = `host:${host}\n`;
  let signedHeaders = 'host';
  if (contentType) {
    canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
    signedHeaders = 'content-type;host';
  }

  const canonicalRequest = [
    method,
    `/${key}`,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD'
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');

  // Derive signing key
  const kDate    = crypto.createHmac('sha256', `AWS4${secretKey}`).update(dateStamp).digest();
  const kRegion  = crypto.createHmac('sha256', kDate).update(AWS_REGION).digest();
  const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();

  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return `https://${host}/${key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
};

/**
 * Generates a presigned PUT URL for client-side direct upload to S3.
 * If AWS credentials are not configured, returns a mock presigned URL.
 *
 * @param {string} originalName - Original filename
 * @param {string} contentType - MIME type of the file
 * @param {string} [folder='tickets'] - S3 folder prefix
 * @returns {{ uploadUrl: string, key: string, publicUrl: string }}
 */
export const getPresignedUploadUrl = (originalName, contentType, folder = 'tickets') => {
  const ext = path.extname(originalName);
  const uniqueId = crypto.randomBytes(12).toString('hex');
  const key = `${folder}/${uniqueId}${ext}`;

  if (!isS3Configured) {
    // Mock fallback for development
    return {
      uploadUrl: `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}?X-Amz-Algorithm=MOCK&X-Amz-Signature=mock-dev-signature`,
      key,
      publicUrl: `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`
    };
  }

  const uploadUrl = generatePresignedUrl('PUT', key, { contentType, expiresIn: 900 }); // 15 min upload window

  return {
    uploadUrl,
    key,
    publicUrl: `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`
  };
};

/**
 * Generates a presigned GET URL for reading an existing S3 object.
 * If AWS credentials are not configured, returns a mock URL.
 *
 * @param {string} key - The S3 object key
 * @param {number} [expiresIn=3600] - Seconds until URL expiry (default 1 hour)
 * @returns {string} Presigned GET URL
 */
export const getPresignedReadUrl = (key, expiresIn = 3600) => {
  if (!isS3Configured) {
    return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}?X-Amz-Algorithm=MOCK&X-Amz-Signature=mock-dev-read`;
  }

  return generatePresignedUrl('GET', key, { expiresIn });
};

// ─── ClamAV-Guarded Upload ──────────────────────────────────────────────────

/**
 * Scans a file buffer with ClamAV before uploading to Cloudinary.
 * If ClamAV reports malware, the upload is rejected.
 *
 * @param {Buffer} fileBuffer - Raw file bytes
 * @param {string} originalName - Original filename
 * @returns {Promise<{ url: string, publicId: string }>}
 * @throws {Error} If ClamAV detects malware
 */
export const uploadToCloudinary = async (fileBuffer, originalName) => {
  // Step 1: Antivirus scan
  const scanResult = await scanBuffer(fileBuffer);
  if (!scanResult.clean) {
    const err = new Error(scanResult.reason);
    err.code = 'MALWARE_DETECTED';
    throw err;
  }

  // Step 2: Proceed with upload
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
