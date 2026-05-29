import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  title: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 150,
    trim: true
  },
  body: {
    type: String,
    required: true,
    minlength: 20
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  status: {
    type: String,
    enum: ['unresolved', 'flagged', 'answered', 'resolved', 'open', 'closed', 'deleted'],
    default: 'unresolved'
  },
  isFAQ: {
    type: Boolean,
    default: false
  },
  linkedBestAnswerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    default: null
  },
  acceptedAnswerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    default: null
  },
  views: {
    type: Number,
    default: 0
  },
  moderationStatus: {
    type: String,
    enum: ['visible', 'flagged', 'under_review', 'rejected', 'approved'],
    default: 'visible'
  }
}, { timestamps: true });

// Define indexes as specified in API_v2.pdf
questionSchema.index({ status: 1, createdAt: -1 });
questionSchema.index({ category: 1, status: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ isFAQ: 1 });
questionSchema.index({ title: 'text', body: 'text' });

export default mongoose.model('Question', questionSchema);
