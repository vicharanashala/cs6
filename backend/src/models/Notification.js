import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'answer_posted',
      'best_answer_selected',
      'answer_approved',
      'answer_rejected',
      'ticket_reply',
      'ticket_resolved'
    ],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  referenceType: {
    type: String,
    enum: ['question', 'answer', 'ticket'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

// Index for pagination and filtering
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
