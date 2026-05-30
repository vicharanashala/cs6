import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 60,
    trim: true
  },
  description: {
    type: String,
    maxlength: 200,
    trim: true
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
