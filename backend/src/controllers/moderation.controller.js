import Report from '../models/Report.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

export const getFlaggedQueue = async (req, res, next) => {
  try {
    // Get all open reports
    const reports = await Report.find({ status: 'open' })
      .populate('reportedBy', 'username name')
      .populate('targetId')
      .lean();

    // Map severity to weight for sorting
    const severityWeight = { high: 3, medium: 2, low: 1 };
    
    // Sort by priority (high severity first)
    reports.sort((a, b) => (severityWeight[b.aiSeverity] || 0) - (severityWeight[a.aiSeverity] || 0));

    return res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

export const getAnsweredQueue = async (req, res, next) => {
  try {
    // Find all answers with status 'pending'
    const pendingAnswers = await Answer.find({ status: 'pending' })
      .populate('author', 'username name avatar role badgeLevel')
      .sort({ createdAt: 1 })
      .lean();
    
    // Group answers by question ID
    const answersMap = {};
    pendingAnswers.forEach(ans => {
      const qid = ans.questionId.toString();
      if (!answersMap[qid]) {
        answersMap[qid] = [];
      }
      answersMap[qid].push(ans);
    });

    const questionIds = Object.keys(answersMap);

    const questions = await Question.find({ _id: { $in: questionIds }, status: { $ne: 'deleted' } })
      .populate('author', 'username name')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Attach pending answers to each question
    const questionsWithAnswers = questions.map(q => ({
      ...q,
      pendingAnswers: answersMap[q._id.toString()] || []
    }));

    return res.status(200).json({
      success: true,
      data: questionsWithAnswers
    });
  } catch (error) {
    next(error);
  }
};

export const getResolvedQueue = async (req, res, next) => {
  try {
    // Find resolved questions that are not promoted to FAQ yet
    const questions = await Question.find({ status: 'resolved', isFAQ: false })
      .populate('author', 'username name')
      .populate('category', 'name')
      .populate('linkedBestAnswerId')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

export const approveItem = async (req, res, next) => {
  try {
    const { targetId } = req.params;

    // Check if target is a question or answer
    let target = await Question.findById(targetId);
    let targetType = 'question';

    if (target) {
      target.moderationStatus = 'approved';
      await target.save();
    } else {
      target = await Answer.findById(targetId);
      targetType = 'answer';
      if (target) {
        target.status = 'visible';
        target.moderationState = 'approved';
        await target.save();
      }
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Flagged item not found'
        }
      });
    }

    // Resolve associated reports
    await Report.updateMany(
      { targetId, status: 'open' },
      { status: 'resolved', resolvedBy: req.user.userId }
    );

    // Notify user
    const authorId = target.author || target.userId;
    if (authorId) {
      await Notification.create({
        userId: authorId,
        type: 'answer_approved', // default maps to approved
        referenceId: target._id,
        referenceType: targetType,
        message: `Your ${targetType} has been approved by moderators and is now visible.`
      });
    }

    await AuditLog.create({
      action: 'approve_flagged',
      performedBy: req.user.userId,
      targetType,
      targetId: target._id,
      details: { targetType }
    });

    return res.status(200).json({
      success: true,
      message: 'Item approved and restored to visible status'
    });
  } catch (error) {
    next(error);
  }
};

export const rejectItem = async (req, res, next) => {
  try {
    const { targetId } = req.params;

    // Check target type
    let target = await Question.findById(targetId);
    let targetType = 'question';

    if (target) {
      target.moderationStatus = 'rejected';
      target.status = 'deleted'; // soft delete
      await target.save();
    } else {
      target = await Answer.findById(targetId);
      targetType = 'answer';
      if (target) {
        target.status = 'rejected';
        target.moderationState = 'rejected';
        await target.save();
      }
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Flagged item not found'
        }
      });
    }

    // Resolve reports
    await Report.updateMany(
      { targetId, status: 'open' },
      { status: 'resolved', resolvedBy: req.user.userId }
    );

    // Notify user
    const authorId = target.author || target.userId;
    if (authorId) {
      await Notification.create({
        userId: authorId,
        type: 'answer_rejected',
        referenceId: target._id,
        referenceType: targetType,
        message: `Your ${targetType} was rejected following moderator review.`
      });
    }

    await AuditLog.create({
      action: 'reject_flagged',
      performedBy: req.user.userId,
      targetType,
      targetId: target._id,
      details: { targetType }
    });

    return res.status(200).json({
      success: true,
      message: 'Item rejected and hidden from public view'
    });
  } catch (error) {
    next(error);
  }
};

export const escalateItem = async (req, res, next) => {
  try {
    const { targetId } = req.params;

    const reportsCount = await Report.countDocuments({ targetId, status: 'open' });
    if (reportsCount === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No active reports found for this item'
        }
      });
    }

    // Update reports to escalated
    await Report.updateMany(
      { targetId, status: 'open' },
      { status: 'escalated' }
    );

    // Update target status to under_review
    let target = await Question.findById(targetId);
    let targetType = 'question';
    if (target) {
      target.moderationStatus = 'under_review';
      await target.save();
    } else {
      target = await Answer.findById(targetId);
      targetType = 'answer';
      if (target) {
        target.status = 'under_review';
        await target.save();
      }
    }

    await AuditLog.create({
      action: 'escalate_flagged',
      performedBy: req.user.userId,
      targetType,
      targetId,
      details: { reportsCount }
    });

    return res.status(200).json({
      success: true,
      message: 'Item escalated to senior administration review'
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLog = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('performedBy', 'username name role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemStats = async (req, res, next) => {
  try {
    const totalFAQs = await Question.countDocuments({ isFAQ: true, status: { $ne: 'deleted' } });
    const activeStudents = await User.countDocuments({ role: 'user', status: 'active' });
    const totalReports = await Report.countDocuments();

    return res.status(200).json({
      success: true,
      data: {
        totalFAQs,
        activeStudents,
        totalReports
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getApprovedAnswers = async (req, res, next) => {
  try {
    const answers = await Answer.find({ moderationState: 'approved' })
      .populate('author', 'username name')
      .populate({
        path: 'questionId',
        select: 'title'
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: answers
    });
  } catch (error) {
    next(error);
  }
};

export const getRejectedAnswers = async (req, res, next) => {
  try {
    const answers = await Answer.find({ $or: [{ status: 'rejected' }, { moderationState: 'rejected' }] })
      .populate('author', 'username name')
      .populate({
        path: 'questionId',
        select: 'title'
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: answers
    });
  } catch (error) {
    next(error);
  }
};

