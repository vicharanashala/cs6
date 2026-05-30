import mongoose from 'mongoose';

const passwordResetOTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,       // bcrypt-hashed OTP
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB TTL index — auto-deletes expired docs
  },
  attempts: {
    type: Number,
    default: 0           // brute-force counter (max 5 tries)
  },
  used: {
    type: Boolean,
    default: false        // prevent OTP reuse after verification
  }
}, { timestamps: true });

export default mongoose.model('PasswordResetOTP', passwordResetOTPSchema);
