import mongoose from 'mongoose';

import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin', 'superadmin'],
    default: 'user'
  },
  badgeLevel: {
    type: String,
    enum: ['Newbie', 'Approved Contributor', 'Top Leaderboard'],
    default: 'Newbie'
  },
  name: {
    type: String,
    minlength: 2,
    maxlength: 50,
    trim: true
  },
  avatar: {
    type: String,
    default: ""
  },
  profileMetadata: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'deactivated'],
    default: 'active'
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  internshipStartDate: {
    type: Date,
    default: null
  },
  mfaSecret: {
    type: String,
    default: null
  },
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  }
}, { timestamps: { createdAt: 'createdAt', updatedAt: true } }); // Sync updatedAt to trace user modifications

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model('User', userSchema);
