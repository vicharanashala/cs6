import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_SALT = 'faq-portal-aes-salt';

// Derive a secure 32-byte key from the environment variable (or a default fallback in dev)
const getEncryptionKey = () => {
  const secret = process.env.ENCRYPTION_KEY || 'default-secret-key-32-chars-long-fallback!';
  return crypto.scryptSync(secret, ENCRYPTION_SALT, 32);
};

/**
 * Encrypts a plain text string using AES-256-CBC
 * @param {string} text
 * @returns {string} ivHex:encryptedHex
 */
export const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts a hex string (ivHex:encryptedHex) back to plain text
 * @param {string} cipherText
 * @returns {string} plainText
 */
export const decrypt = (cipherText) => {
  if (!cipherText) return null;
  const parts = cipherText.split(':');
  if (parts.length !== 2) return null;
  
  const [ivHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
