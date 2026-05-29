import Answer from '../models/Answer.js';
import Question from '../models/Question.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

export const getAnswersForQuestion = async (req, res, next) => {
  try {
    const { id } = req.params; // Question ID

    // Only show visible answers to public. If moderator or admin, they can see pending/flagged answers too.
    const query = { questionId: id, status: 'visible' };
    if (req.user && ['moderator', 'admin'].includes(req.user.role)) {
      delete query.status;
      query.status = { $ne: 'deleted' }; // Hide deleted answers
    }

    const answers = await Answer.find(query)
      .populate('author', 'username name avatar role badgeLevel')
      .sort({ isBestAnswer: -1, upvoteCount: -1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: answers
    });
  } catch (error) {
    next(error);
  }
};

export const createAnswer = async (req, res, next) => {
  try {
    const { id } = req.params; // Question ID
    const { body } = req.body;

    const question = await Question.findById(id);
    if (!question || question.status === 'deleted') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Question not found'
        }
      });
    }

    const newAnswer = new Answer({
      questionId: id,
      author: req.user.userId,
      body,
      status: 'pending',
      moderationState: 'pending'
    });

    await newAnswer.save();

    // Dynamically assign 'answered' state once a question receives community answer
    if (question.status === 'unresolved') {
      question.status = 'answered';
      await question.save();
    }

    // Trigger Notification for question owner
    if (question.author.toString() !== req.user.userId) {
      await Notification.create({
        userId: question.author,
        type: 'answer_posted',
        referenceId: question._id,
        referenceType: 'question',
        message: `Someone answered your question: "${question.title.slice(0, 60)}..."`
      });
    }

    return res.status(201).json({
      success: true,
      data: newAnswer
    });
  } catch (error) {
    next(error);
  }
};

export const editAnswer = async (req, res, next) => {
  try {
    const answer = req.resource; // cached by requireOwnerOrRole middleware
    const { body } = req.body;

    answer.body = body;
    await answer.save();

    return res.status(200).json({
      success: true,
      data: answer
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnswer = async (req, res, next) => {
  try {
    const answer = req.resource; // cached by requireOwnerOrRole middleware
    
    // Soft-delete
    answer.status = 'deleted';
    await answer.save();

    if (req.user.role !== 'user') {
      await AuditLog.create({
        action: 'delete_answer',
        performedBy: req.user.userId,
        targetType: 'answer',
        targetId: answer._id,
        details: { authorId: answer.author }
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const handleVote = async (req, res, next, voteType) => {
  try {
    const { aid } = req.params;
    const userId = req.user.userId;

    const answer = await Answer.findById(aid);
    if (!answer || answer.status === 'deleted') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Answer not found'
        }
      });
    }

    const userIdStr = userId.toString();
    
    if (!answer.upvotes) answer.upvotes = [];
    if (!answer.downvotes) answer.downvotes = [];

    const upvotesArr = answer.upvotes.map(id => id.toString());
    const downvotesArr = answer.downvotes.map(id => id.toString());

    if (voteType === 'upvote') {
      if (upvotesArr.includes(userIdStr)) {
        // Toggle off
        answer.upvotes = answer.upvotes.filter(id => id.toString() !== userIdStr);
      } else {
        // Toggle on upvote, toggle off downvote
        answer.upvotes.push(userId);
        answer.downvotes = answer.downvotes.filter(id => id.toString() !== userIdStr);
      }
    } else if (voteType === 'downvote') {
      if (downvotesArr.includes(userIdStr)) {
        // Toggle off
        answer.downvotes = answer.downvotes.filter(id => id.toString() !== userIdStr);
      } else {
        // Toggle on downvote, toggle off upvote
        answer.downvotes.push(userId);
        answer.upvotes = answer.upvotes.filter(id => id.toString() !== userIdStr);
      }
    }

    answer.upvoteCount = answer.upvotes.length;
    answer.reputationScore = answer.upvotes.length - answer.downvotes.length;

    await answer.save();

    return res.status(200).json({
      success: true,
      data: answer
    });
  } catch (error) {
    next(error);
  }
};

export const upvoteAnswer = async (req, res, next) => {
  return handleVote(req, res, next, 'upvote');
};

export const downvoteAnswer = async (req, res, next) => {
  return handleVote(req, res, next, 'downvote');
};

export const markAsBestAnswer = async (req, res, next) => {
  try {
    const { aid, id } = req.params; // aid: answer ID, id: question ID

    const answer = await Answer.findOne({ _id: aid, questionId: id });
    if (!answer || answer.status === 'deleted') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Answer not found for this question'
        }
      });
    }

    const question = await Question.findById(id);
    if (!question || question.status === 'deleted') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Question not found'
        }
      });
    }

    // Toggle other best answers off
    await Answer.updateMany({ questionId: id }, { isBestAnswer: false });

    // Set this one as best answer
    answer.isBestAnswer = true;
    answer.status = 'visible'; // Ensure it's visible if it was pending
    answer.moderationState = 'approved';
    await answer.save();

    // Update parent question
    question.linkedBestAnswerId = answer._id;
    question.acceptedAnswerId = answer._id;
    question.status = 'resolved';
    await question.save();

    // Trigger Notification for answer owner
    if (answer.author.toString() !== req.user.userId) {
      await Notification.create({
        userId: answer.author,
        type: 'best_answer_selected',
        referenceId: answer._id,
        referenceType: 'answer',
        message: `Your answer was selected as the best answer for: "${question.title.slice(0, 40)}..."`
      });
    }

    await AuditLog.create({
      action: 'mark_best_answer',
      performedBy: req.user.userId,
      targetType: 'answer',
      targetId: answer._id,
      details: { questionId: id }
    });

    return res.status(200).json({
      success: true,
      data: {
        question,
        answer
      }
    });
  } catch (error) {
    next(error);
  }
};
