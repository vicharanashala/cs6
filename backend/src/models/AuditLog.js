import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['question', 'answer', 'report', 'user', 'category', 'ticket'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

export default mongoose.model('AuditLog', auditLogSchema);
