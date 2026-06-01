import crypto from 'crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a base32 encoded string into a Buffer.
 * @param {string} base32 
 * @returns {Buffer}
 */
export function base32Decode(base32) {
  const clean = base32.replace(/=+$/, '').toUpperCase();
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = ALPHABET.indexOf(clean[i]);
    if (val === -1) {
      throw new Error('Invalid base32 character');
    }
    bits += val.toString(2).padStart(5, '0');
  }
  
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Generates a counter-based one-time password (HOTP).
 * @param {string} secret Base32 secret string
 * @param {number} counter Counter value
 * @returns {string} 6-digit OTP
 */
export function generateHOTP(secret, counter) {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buf);
  const hmacResult = hmac.digest();

  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code = (
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)
  ) % 1000000;

  return String(code).padStart(6, '0');
}

/**
 * Generates a time-based one-time password (TOTP).
 * @param {string} secret Base32 secret string
 * @param {number} timeStep Time step in seconds (default 30)
 * @returns {string} 6-digit OTP
 */
export function generateTOTP(secret, timeStep = 30) {
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  return generateHOTP(secret, counter);
}

/**
 * Verifies a time-based one-time password (TOTP).
 * Supports clock drift window.
 * @param {string} token 6-digit code to verify
 * @param {string} secret Base32 secret string
 * @param {number} window Verification window size (default 1)
 * @param {number} timeStep Time step in seconds (default 30)
 * @returns {boolean}
 */
export function verifyTOTP(token, secret, window = 1, timeStep = 30) {
  if (!token || !secret) return false;
  const currentCounter = Math.floor(Date.now() / 1000 / timeStep);
  
  for (let i = -window; i <= window; i++) {
    const calculated = generateHOTP(secret, currentCounter + i);
    if (calculated === token) {
      return true;
    }
  }
  return false;
}

/**
 * Generates a secure random base32 encoded secret.
 * @param {number} length Number of bytes (default 20, fits RFC requirements)
 * @returns {string} Base32 encoded secret
 */
export function generateSecret(length = 20) {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return result;
}
