import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 2000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open'
  },
  attachments: [{
    url: String, // Cloudinary URL
    publicId: String, // Cloudinary public_id for deletion
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Define indexes as specified in API_v2.pdf
supportTicketSchema.index({ createdBy: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model('SupportTicket', supportTicketSchema);
