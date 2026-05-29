import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  body: {
    type: String,
    required: true,
    minlength: 30,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['pending', 'visible', 'flagged', 'under_review', 'rejected', 'deleted'],
    default: 'pending'
  },
  moderationState: {
    type: String,
    enum: ['visible', 'flagged', 'under_review', 'approved', 'pending', 'rejected', 'deleted'],
    default: 'pending'
  },
  isBestAnswer: {
    type: Boolean,
    default: false
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  upvoteCount: {
    type: Number,
    default: 0
  },
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reputationScore: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Define indexes as specified in API_v2.pdf
answerSchema.index({ questionId: 1 });
answerSchema.index({ questionId: 1, status: 1 });
answerSchema.index({ author: 1 });

const AnswerModel = mongoose.model('Answer', answerSchema);
mongoose.model('answer', answerSchema);
export default AnswerModel;
