import User from '../models/User.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import AuditLog from '../models/AuditLog.js';
import { logSecurityEvent } from '../utils/audit.js';

export const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user || user.status === 'deactivated') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found'
        }
      });
    }

    // Compute stats
    const questionsAsked = await Question.countDocuments({ author: id, status: { $ne: 'deleted' } });
    const answersGiven = await Answer.countDocuments({ author: id, status: 'visible' });
    const bestAnswers = await Answer.countDocuments({ author: id, isBestAnswer: true, status: 'visible' });

    const userAnswers = await Answer.find({ author: id, status: 'visible' }).select('upvoteCount').lean();
    const upvotesReceived = userAnswers.reduce((sum, a) => sum + (a.upvoteCount || 0), 0);

    const responseData = {
      _id: user._id,
      username: user.username,
      name: user.name || user.username,
      role: user.role,
      avatar: user.avatar || '',
      profileMetadata: user.profileMetadata || {},
      joinedAt: user.createdAt,
      stats: {
        questionsAsked,
        answersGiven,
        bestAnswers,
        upvotesReceived
      }
    };

    if (req.user && (req.user.userId === id || ['admin', 'superadmin'].includes(req.user.role))) {
      responseData.email = user.email;
    }

    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

export const getUserQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 20, cursor } = req.query;

    const query = { author: id, status: { $ne: 'deleted' } };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const limitNum = parseInt(limit, 10) || 20;

    const questions = await Question.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limitNum + 1);

    const hasMore = questions.length > limitNum;
    if (hasMore) questions.pop();

    const nextCursor = questions.length > 0 ? questions[questions.length - 1]._id : null;

    return res.status(200).json({
      success: true,
      data: questions,
      meta: {
        nextCursor,
        hasMore
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserAnswers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 20, cursor } = req.query;

    const query = { author: id };
    if (req.user && (req.user.userId === id || req.user.role === 'admin')) {
      query.status = { $ne: 'deleted' };
    } else {
      query.status = 'visible';
    }
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const limitNum = parseInt(limit, 10) || 20;

    const answers = await Answer.find(query)
      .populate({
        path: 'questionId',
        select: 'title',
        populate: { path: 'category', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(limitNum + 1);

    const hasMore = answers.length > limitNum;
    if (hasMore) answers.pop();

    const nextCursor = answers.length > 0 ? answers[answers.length - 1]._id : null;

    return res.status(200).json({
      success: true,
      data: answers,
      meta: {
        nextCursor,
        hasMore
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { name, username, avatar, role, profileMetadata } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found'
        }
      });
    }

    if (name) user.name = name;
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Username is already taken'
          }
        });
      }
      user.username = username;
    }
    if (avatar !== undefined) user.avatar = avatar;
    if (role !== undefined) {
      if (['user', 'moderator', 'admin'].includes(role) && role !== 'superadmin') {
        user.role = role;
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid role value or insufficient permissions'
          }
        });
      }
    }
    if (profileMetadata !== undefined) {
      // Direct assignment works or Mongoose mixed needs markModified if nested, but user.save() will save object.
      // To be safe, we can use user.markModified('profileMetadata')
      user.profileMetadata = profileMetadata;
      user.markModified('profileMetadata');
    }

    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        badgeLevel: user.badgeLevel,
        avatar: user.avatar,
        profileMetadata: user.profileMetadata,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

export const listStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $in: ['moderator', 'admin'] } })
      .select('username name role avatar')
      .sort({ name: 1, username: 1 });
    return res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

export const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role value'
        }
      });
    }

    // Only superadmin can promote/demote admins or superadmins
    if (['admin', 'superadmin'].includes(role) && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden: Only a superadmin can assign the admin or superadmin role.'
        }
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    user.role = role;
    await user.save();

    await logSecurityEvent({
      req,
      action: 'change_user_role',
      targetType: 'user',
      targetId: user._id,
      details: { role }
    });

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    user.status = 'deactivated';
    await user.save();

    await logSecurityEvent({
      req,
      action: 'deactivate_user',
      targetType: 'user',
      targetId: user._id,
      details: { username: user.username }
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
