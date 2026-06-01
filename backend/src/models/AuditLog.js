import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  targetType: {
    type: String,
    enum: ['question', 'answer', 'report', 'user', 'category', 'ticket', 'auth'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  ip: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

export default mongoose.model('AuditLog', auditLogSchema);
