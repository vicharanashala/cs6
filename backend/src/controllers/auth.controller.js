import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import PasswordResetOTP from "../models/PasswordResetOTP.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendOTPEmail } from "../utils/email.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { generateSecret, verifyTOTP } from "../utils/totp.js";
import { logSecurityEvent } from "../utils/audit.js";

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      organizationId: user.organizationId || null
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m' // 15 minutes for access tokens
    }
  );
};

const generateRefreshToken = async (user) => {
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET, // using same secret for simplicity, or separate if defined
    { expiresIn: '7d' }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Store refresh token in DB
  await RefreshToken.create({
    token,
    userId: user._id,
    expiresAt
  });

  return token;
};

export const register = async (req, res, next) => {
  try {
    const { username, name, email, password, internshipStartDate } = req.body;

    // Check uniqueness
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          fields: { email: 'Email is already registered' }
        }
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          fields: { username: 'Username is already taken' }
        }
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'user', // Default role for standard registers
      internshipStartDate: internshipStartDate ? new Date(internshipStartDate) : null
    });

    await newUser.save();

    const accessToken = generateAccessToken(newUser);
    const refreshToken = await generateRefreshToken(newUser);

    return res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: newUser._id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          badgeLevel: newUser.badgeLevel,
          avatar: newUser.avatar,
          createdAt: newUser.createdAt,
          internshipStartDate: newUser.internshipStartDate
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.status === 'deactivated') {
      await logSecurityEvent({ req, action: 'login_failed', details: { email, reason: 'User not found or deactivated' } });
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password'
        }
      });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      await logSecurityEvent({ req, action: 'login_failed', performedBy: user._id, targetId: user._id, details: { email, reason: 'Account locked' } });
      const minutesRemaining = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Account is temporarily locked due to too many failed login attempts. Try again in ${minutesRemaining} minutes.`
        }
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
      }
      await user.save();
      await logSecurityEvent({ req, action: 'login_failed', performedBy: user._id, targetId: user._id, details: { email, reason: 'Password mismatch', failedAttempts: user.failedAttempts } });

      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password'
        }
      });
    }

    // Reset failed attempts on successful credentials match
    user.failedAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      const mfaToken = jwt.sign(
        { userId: user._id, purpose: 'mfa-login' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      await logSecurityEvent({ req, action: 'login_mfa_required', performedBy: user._id, targetId: user._id, details: { email } });
      return res.status(200).json({
        success: true,
        data: {
          mfaRequired: true,
          mfaToken
        }
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    await logSecurityEvent({ req, action: 'login_success', performedBy: user._id, targetId: user._id, details: { email } });

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          badgeLevel: user.badgeLevel,
          avatar: user.avatar,
          createdAt: user.createdAt,
          internshipStartDate: user.internshipStartDate
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user || user.status === 'deactivated') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required'
        }
      });
    }

    // Verify token structure & exists in DB
    const dbToken = await RefreshToken.findOne({ token: refreshToken });
    if (!dbToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired refresh token'
        }
      });
    }

    // Verify token validity
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      // Clean up token from DB if expired in JWT but still in DB
      await RefreshToken.deleteOne({ token: refreshToken });
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired refresh token'
        }
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.status === 'deactivated') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User no longer exists or is deactivated'
        }
      });
    }

    // Rotate refresh token (invalidate old one)
    await RefreshToken.deleteOne({ token: refreshToken });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          fields: { currentPassword: 'Current password is incorrect' }
        }
      });
    }

    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password: Step 1 — Request OTP ────────────────────────────────────

// Simple in-memory rate limiter: max 3 OTP requests per email per hour
const otpRateLimit = new Map();

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting check
    const now = Date.now();
    const key = `otp:${normalizedEmail}`;
    const history = otpRateLimit.get(key) || [];
    const recentRequests = history.filter(ts => now - ts < 3600000); // last hour
    if (recentRequests.length >= 3) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT',
          message: 'Too many OTP requests. Please try again later.'
        }
      });
    }

    // Generic response — never reveal if email exists or not
    const genericSuccess = {
      success: true,
      message: 'If this email is registered, you will receive a password reset code shortly.'
    };

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.status === 'deactivated') {
      // Return success anyway to prevent email enumeration
      return res.status(200).json(genericSuccess);
    }

    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();

    // Hash the OTP before storing
    const otpHash = await bcrypt.hash(otpCode, 10);

    // Delete any previous OTPs for this email
    await PasswordResetOTP.deleteMany({ email: normalizedEmail });

    // Store hashed OTP
    await PasswordResetOTP.create({
      email: normalizedEmail,
      otp: otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send email
    const emailSent = await sendOTPEmail(normalizedEmail, otpCode);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'EMAIL_FAILED',
          message: 'Failed to send OTP email. Please try again.'
        }
      });
    }

    // Update rate limit
    recentRequests.push(now);
    otpRateLimit.set(key, recentRequests);

    return res.status(200).json(genericSuccess);
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password: Step 2 — Verify OTP ─────────────────────────────────────

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const record = await PasswordResetOTP.findOne({
      email: normalizedEmail,
      used: false
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'No active OTP found. Please request a new one.'
        }
      });
    }

    // Check expiry
    if (record.expiresAt < new Date()) {
      await PasswordResetOTP.deleteOne({ _id: record._id });
      return res.status(400).json({
        success: false,
        error: {
          code: 'OTP_EXPIRED',
          message: 'OTP has expired. Please request a new one.'
        }
      });
    }

    // Brute-force protection
    if (record.attempts >= 5) {
      await PasswordResetOTP.deleteOne({ _id: record._id });
      return res.status(400).json({
        success: false,
        error: {
          code: 'OTP_MAX_ATTEMPTS',
          message: 'Too many incorrect attempts. Please request a new OTP.'
        }
      });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, record.otp);
    if (!isValid) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: `Incorrect OTP. ${5 - record.attempts} attempt(s) remaining.`
        }
      });
    }

    // Mark OTP as used
    record.used = true;
    await record.save();

    // Generate a short-lived reset token (15 min)
    const resetToken = jwt.sign(
      { email: normalizedEmail, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      success: true,
      data: { resetToken },
      message: 'OTP verified successfully. You can now reset your password.'
    });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password: Step 3 — Reset Password ─────────────────────────────────

export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Reset token is invalid or has expired. Please restart the process.'
        }
      });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid reset token.'
        }
      });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.'
        }
      });
    }

    // Hash new password and save
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Clean up: delete all OTPs for this email
    await PasswordResetOTP.deleteMany({ email: decoded.email });

    // Invalidate all existing refresh tokens (force re-login on all devices)
    await RefreshToken.deleteMany({ userId: user._id });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// ─── MFA Endpoints ───────────────────────────────────────────────────────────

export const loginMFA = async (req, res, next) => {
  try {
    const { mfaToken, code } = req.body;
    if (!mfaToken || !code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'MFA token and 6-digit code are required.'
        }
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(mfaToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'MFA login token is invalid or has expired.'
        }
      });
    }

    if (decoded.purpose !== 'mfa-login') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid MFA login token.'
        }
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.status === 'deactivated') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User no longer exists or is deactivated.'
        }
      });
    }

    const decryptedSecret = decrypt(user.mfaSecret);
    const isValid = verifyTOTP(code, decryptedSecret);
    if (!isValid) {
      await logSecurityEvent({ req, action: 'mfa_login_failed', performedBy: user._id, targetId: user._id, details: { reason: 'Incorrect TOTP code' } });
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid 6-digit verification code.'
        }
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    await logSecurityEvent({ req, action: 'mfa_login_success', performedBy: user._id, targetId: user._id });

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          badgeLevel: user.badgeLevel,
          avatar: user.avatar,
          createdAt: user.createdAt,
          internshipStartDate: user.internshipStartDate
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const setupMFA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'MFA is already enabled' }
      });
    }

    const secret = generateSecret(20);
    user.mfaSecret = encrypt(secret);
    await user.save();

    await logSecurityEvent({ req, action: 'mfa_setup_initiated', performedBy: user._id, targetId: user._id });

    const label = encodeURIComponent(`FAQPortal:${user.email}`);
    const issuer = encodeURIComponent('FAQPortal');
    const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

    return res.status(200).json({
      success: true,
      data: {
        secret,
        otpauthUrl,
        qrCodeUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyMFA = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Verification code is required' }
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.mfaSecret) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'MFA is not set up' }
      });
    }

    const decryptedSecret = decrypt(user.mfaSecret);
    const isValid = verifyTOTP(code, decryptedSecret);
    if (!isValid) {
      await logSecurityEvent({ req, action: 'mfa_enable_failed', performedBy: user._id, targetId: user._id, details: { reason: 'Incorrect TOTP code' } });
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'Invalid 6-digit verification code' }
      });
    }

    user.mfaEnabled = true;
    await user.save();

    await logSecurityEvent({ req, action: 'mfa_enabled', performedBy: user._id, targetId: user._id });

    return res.status(200).json({
      success: true,
      message: 'Multi-factor authentication enabled successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const disableMFA = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Verification code is required' }
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'MFA is not enabled' }
      });
    }

    const decryptedSecret = decrypt(user.mfaSecret);
    const isValid = verifyTOTP(code, decryptedSecret);
    if (!isValid) {
      await logSecurityEvent({ req, action: 'mfa_disable_failed', performedBy: user._id, targetId: user._id, details: { reason: 'Incorrect TOTP code' } });
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'Invalid 6-digit verification code' }
      });
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    await user.save();

    await logSecurityEvent({ req, action: 'mfa_disabled', performedBy: user._id, targetId: user._id });

    return res.status(200).json({
      success: true,
      message: 'Multi-factor authentication disabled successfully'
    });
  } catch (error) {
    next(error);
  }
};
