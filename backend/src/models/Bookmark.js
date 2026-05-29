import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  }
}, { timestamps: true });

// Composite unique index to ensure no duplicate bookmarks per user
bookmarkSchema.index({ userId: 1, questionId: 1 }, { unique: true });

export default mongoose.model('Bookmark', bookmarkSchema);
