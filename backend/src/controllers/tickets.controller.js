import SupportTicket from '../models/SupportTicket.js';
import TicketMessage from '../models/TicketMessage.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/upload.service.js';

export const getTickets = async (req, res, next) => {
  try {
    const filter = {};
    
    // Users can only see their own tickets. Mods and Admins see all.
    if (req.user.role === 'user') {
      filter.createdBy = req.user.userId;
    }

    const tickets = await SupportTicket.find(filter)
      .populate('createdBy', 'username name')
      .populate('assignedTo', 'username name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

export const createTicket = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;

    const ticket = new SupportTicket({
      title,
      description,
      category: category || 'other',
      createdBy: req.user.userId,
      status: 'open'
    });

    await ticket.save();

    return res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id)
      .populate('createdBy', 'username name avatar role')
      .populate('assignedTo', 'username name avatar role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Support ticket not found'
        }
      });
    }

    // Authorization: User must be ticket owner OR a moderator/admin
    const isOwner = ticket.createdBy._id.toString() === req.user.userId;
    const hasPrivilege = ['moderator', 'admin'].includes(req.user.role);

    if (!isOwner && !hasPrivilege) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden: You do not have permission to view this ticket'
        }
      });
    }

    // Get thread replies
    const messages = await TicketMessage.find({ ticketId: id })
      .populate('author', 'username name avatar role')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: {
        ticket,
        messages
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status value'
        }
      });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ticket not found'
        }
      });
    }

    ticket.status = status;
    await ticket.save();

    // Trigger Notification for resolved
    if (status === 'resolved') {
      await Notification.create({
        userId: ticket.createdBy,
        type: 'ticket_resolved',
        referenceId: ticket._id,
        referenceType: 'ticket',
        message: `Your support ticket: "${ticket.title}" has been marked as resolved.`
      });
    }

    await AuditLog.create({
      action: 'update_ticket_status',
      performedBy: req.user.userId,
      targetType: 'ticket',
      targetId: ticket._id,
      details: { status }
    });

    return res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

export const postTicketMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ticket not found'
        }
      });
    }

    // Authorization
    const isOwner = ticket.createdBy.toString() === req.user.userId;
    const hasPrivilege = ['moderator', 'admin'].includes(req.user.role);

    if (!isOwner && !hasPrivilege) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden: You cannot post replies to this ticket'
        }
      });
    }

    const newMessage = new TicketMessage({
      ticketId: id,
      author: req.user.userId,
      body
    });

    await newMessage.save();

    // Trigger Notification if moderator replies
    if (hasPrivilege && !isOwner) {
      await Notification.create({
        userId: ticket.createdBy,
        type: 'ticket_reply',
        referenceId: ticket._id,
        referenceType: 'ticket',
        message: `A support agent replied to your ticket: "${ticket.title}"`
      });
    }

    return res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Attachment file is required'
        }
      });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ticket not found'
        }
      });
    }

    // Verify Ownership
    if (ticket.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden: Only the ticket owner can attach screenshots'
        }
      });
    }

    // Upload to Cloudinary / Mock
    const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    
    ticket.attachments.push({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      uploadedAt: new Date()
    });

    await ticket.save();

    return res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAttachment = async (req, res, next) => {
  try {
    const { id, aid } = req.params; // id: ticket ID, aid: attachment ID

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ticket not found'
        }
      });
    }

    // Verify Ownership or Mod+
    const isOwner = ticket.createdBy.toString() === req.user.userId;
    const hasPrivilege = ['moderator', 'admin'].includes(req.user.role);

    if (!isOwner && !hasPrivilege) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden: You do not have permission to delete this attachment'
        }
      });
    }

    const attachment = ticket.attachments.id(aid);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Attachment not found'
        }
      });
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(attachment.publicId);

    // Pull from subdocument array
    ticket.attachments = ticket.attachments.filter(att => att._id.toString() !== aid);
    await ticket.save();

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const assignTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ticket not found'
        }
      });
    }

    // Validate assigned user exists and is a Moderator or Admin
    const targetUser = await User.findById(assignedTo);
    if (!targetUser || !['moderator', 'admin'].includes(targetUser.role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Support tickets can only be assigned to moderators or administrators'
        }
      });
    }

    ticket.assignedTo = assignedTo;
    ticket.status = 'in_progress';
    await ticket.save();

    await AuditLog.create({
      action: 'assign_ticket',
      performedBy: req.user.userId,
      targetType: 'ticket',
      targetId: ticket._id,
      details: { assignedTo }
    });

    return res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};
