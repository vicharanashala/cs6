import Report from '../models/Report.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

export const createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, type, description } = req.body;

    // Validate target exists
    let target;
    if (targetType === 'question') {
      target = await Question.findById(targetId);
    } else if (targetType === 'answer') {
      target = await Answer.findById(targetId);
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Target content to report not found'
        }
      });
    }

    // Prevent duplicate reports from the same user on the same content
    const existingReport = await Report.findOne({
      targetId,
      reportedBy: req.user.userId,
      status: { $in: ['open', 'resolved', 'escalated'] }
    });
    if (existingReport) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_REPORT',
          message: 'You have already reported this content'
        }
      });
    }

    // Prevent reporting admin content
    if (target.author) {
      const authorUser = await User.findById(target.author);
      if (authorUser && authorUser.role === 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot report content created by an Administrator'
          }
        });
      }
    }

    // AI Moderation engine logic mock:
    // Determine severity based on content / type / description keywords
    let aiSeverity = 'low';
    const textToAnalyze = `${type} ${description || ''}`.toLowerCase();
    
    const highKeywords = ['abuse', 'harass', 'hate', 'racist', 'slur', 'threat', 'fuck', 'bitch'];
    const mediumKeywords = ['spam', 'misinformation', 'ad ', 'sell', 'buy', 'promo', 'fake', 'lie'];

    if (highKeywords.some(keyword => textToAnalyze.includes(keyword))) {
      aiSeverity = 'high';
    } else if (mediumKeywords.some(keyword => textToAnalyze.includes(keyword))) {
      aiSeverity = 'medium';
    }

    // Create Report
    const report = new Report({
      targetType,
      targetId,
      reportedBy: req.user.userId,
      type,
      description,
      aiSeverity,
      status: 'open'
    });

    await report.save();

    // High severity automatically flags content
    if (aiSeverity === 'high') {
      if (targetType === 'question') {
        target.moderationStatus = 'flagged';
      } else {
        target.status = 'flagged';
      }
      await target.save();
    }

    return res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const { status, type } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const reports = await Report.find(filter)
      .populate('reportedBy', 'username name')
      .populate('resolvedBy', 'username name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate('reportedBy', 'username name')
      .populate('resolvedBy', 'username name');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

export const resolveReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found'
        }
      });
    }

    report.status = 'resolved';
    report.resolvedBy = req.user.userId;
    await report.save();

    // Take action: hide the reported item (set to rejected / deleted)
    if (report.targetType === 'question') {
      await Question.findByIdAndUpdate(report.targetId, {
        moderationStatus: 'rejected',
        status: 'deleted'
      });
    } else if (report.targetType === 'answer') {
      await Answer.findByIdAndUpdate(report.targetId, {
        status: 'rejected'
      });
    }

    await AuditLog.create({
      action: 'resolve_report',
      performedBy: req.user.userId,
      targetType: 'report',
      targetId: report._id,
      details: { targetType: report.targetType, targetId: report.targetId }
    });

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

export const dismissReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found'
        }
      });
    }

    report.status = 'dismissed';
    report.resolvedBy = req.user.userId;
    await report.save();

    // Restore target visibility if it was flagged/under_review
    if (report.targetType === 'question') {
      const target = await Question.findById(report.targetId);
      if (target && ['flagged', 'under_review'].includes(target.moderationStatus)) {
        target.moderationStatus = 'approved';
        await target.save();
      }
    } else if (report.targetType === 'answer') {
      const target = await Answer.findById(report.targetId);
      if (target && ['flagged', 'under_review'].includes(target.status)) {
        target.status = 'visible';
        await target.save();
      }
    }

    await AuditLog.create({
      action: 'dismiss_report',
      performedBy: req.user.userId,
      targetType: 'report',
      targetId: report._id,
      details: { targetType: report.targetType, targetId: report.targetId }
    });

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// Returns the list of targetIds the current user has already reported
export const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find(
      { reportedBy: req.user.userId },
      { targetId: 1, targetType: 1, _id: 0 }
    ).lean();

    // Return a simple array of { targetId, targetType } objects
    return res.status(200).json({
      success: true,
      data: reports.map(r => ({ targetId: r.targetId.toString(), targetType: r.targetType }))
    });
  } catch (error) {
    next(error);
  }
};
