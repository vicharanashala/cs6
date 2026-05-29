import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  targetType: {
    type: String,
    enum: ['question', 'answer'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null if AI-flagged
  },
  type: {
    type: String,
    enum: ['spam', 'abuse', 'misinformation', 'irrelevant', 'outdated'],
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  aiSeverity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'dismissed'],
    default: 'open'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

// Define indexes as specified in API_v2.pdf
reportSchema.index({ status: 1, aiSeverity: -1 });

export default mongoose.model('Report', reportSchema);
