import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket',
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
    minlength: 1,
    maxlength: 2000
  }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

// Index for query performance
ticketMessageSchema.index({ ticketId: 1 });

export default mongoose.model('TicketMessage', ticketMessageSchema);
