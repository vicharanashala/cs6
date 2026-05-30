import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import AuditLog from '../models/AuditLog.js';
import Report from '../models/Report.js';
import { checkDuplicate, findSimilarQuestions, findDuplicateQuestions } from '../services/duplicate.service.js';
import { moderateText } from '../utils/moderation.js';
import { generateEmbedding } from '../utils/embeddings.js';

export const getQuestions = async (req, res, next) => {
  try {
    const { status = 'open', category, tag, cursor, limit = 20, sort = 'newest' } = req.query;

    const query = {};
    if (status !== 'all') {
      // If comma-separated, treat as $in array
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    } else {
      query.status = { $ne: 'deleted' };
    }
    
    // Ensure we do not display soft-deleted questions to public unless requested by admin
    if ((status === 'deleted' || (query.status && query.status.$in && query.status.$in.includes('deleted'))) && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden: Access to deleted questions is restricted.'
        }
      });
    }

    if (category) query.category = category;
    if (tag) query.tags = tag;

    let sortConfig = { _id: -1 };
    if (sort === 'oldest') {
      sortConfig = { _id: 1 };
      if (cursor) query._id = { $gt: cursor };
    } else {
      // Default to newest
      if (cursor) query._id = { $lt: cursor };
    }

    if (sort === 'mostViewed') {
      sortConfig = { views: -1, _id: -1 };
    } else if (sort === 'unanswered') {
      query.linkedBestAnswerId = null;
    } else if (sort === 'helpful') {
      sortConfig = { helpfulVotesCount: -1, _id: -1 };
    }

    const limitNum = parseInt(limit, 10) || 20;

    // Handle mostUpvoted using aggregation on Answer model
    if (sort === 'mostUpvoted') {
      const topAnswers = await Answer.aggregate([
        { $match: { status: 'visible' } },
        { $sort: { upvoteCount: -1 } },
        { $group: { _id: "$questionId", upvoteCount: { $first: "$upvoteCount" } } },
        { $sort: { upvoteCount: -1 } },
        { $limit: limitNum }
      ]);

      const questionIds = topAnswers.map(a => a._id);

      const questions = await Question.find({ 
        _id: { $in: questionIds }, 
        status: { $ne: 'deleted' } 
      })
        .populate('author', 'username name avatar role badgeLevel')
        .populate('category', 'name');

      // Sort questions based on the aggregated topAnswers order
      questions.sort((a, b) => {
         return questionIds.findIndex(id => id.equals(a._id)) - questionIds.findIndex(id => id.equals(b._id));
      });

      return res.status(200).json({
        success: true,
        data: questions,
        meta: { nextCursor: null, hasMore: false, total: questions.length }
      });
    }

    const questions = await Question.find(query)
      .populate('author', 'username name avatar role badgeLevel')
      .populate('category', 'name')
      .sort(sortConfig)
      .limit(limitNum + 1);

    const hasMore = questions.length > limitNum;
    if (hasMore) questions.pop();

    const nextCursor = questions.length > 0 ? questions[questions.length - 1]._id : null;
    const total = await Question.countDocuments({ ...query, _id: { $exists: true } });

    return res.status(200).json({
      success: true,
      data: questions,
      meta: {
        nextCursor,
        hasMore,
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req, res, next) => {
  try {
    const { title, body, tags, category } = req.body;

    // Trigger duplicate check (threshold 0.4)
    const duplicateResult = await checkDuplicate(title, body, 0.4);
    if (duplicateResult.isDuplicate) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_QUESTION',
          message: 'This question is too similar to an existing query.',
          fields: {
            duplicateId: duplicateResult.topMatch._id,
            title: duplicateResult.topMatch.title,
            score: duplicateResult.score
          }
        }
      });
    }

    // Generate embedding for the question title
    let embedding;
    try {
      embedding = await generateEmbedding(title);
    } catch (err) {
      console.error("[VectorSearch] Failed to generate embedding during create:", err.message);
    }

    // Step 2 — Temporarily store content in pending state
    const newQuestion = new Question({
      title,
      body,
      tags: tags || [],
      category,
      author: req.user.userId,
      organizationId: req.user.organizationId || null,
      status: 'pending',
      moderationStatus: 'pending',
      embedding
    });

    await newQuestion.save();

    // Check staff privilege (admin/moderator questions are auto-approved)
    const isStaff = ['moderator', 'admin'].includes(req.user.role);
    if (isStaff) {
      newQuestion.status = 'unresolved';
      newQuestion.moderationStatus = 'approved';
      await newQuestion.save();

      return res.status(201).json({
        success: true,
        data: newQuestion
      });
    }

    // Step 3 — Moderation API Called
    const modResult = await moderateText(`${title} ${body}`);

    // Step 5 — Moderation Decision Engine
    if (modResult.isHighlyUnsafe) {
      // Content auto-blocked / rejected
      newQuestion.status = 'deleted';
      newQuestion.moderationStatus = 'rejected';
      await newQuestion.save();

      // Create high-severity AI report
      await Report.create({
        targetType: 'question',
        targetId: newQuestion._id,
        reportedBy: null,
        type: 'abuse',
        description: `${modResult.reason} (Auto-Moderation blocked highly unsafe content)`,
        aiSeverity: 'high',
        status: 'open'
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'AI_MODERATION_BLOCKED',
          message: 'Your question was auto-blocked because it contains highly unsafe or abusive language.'
        }
      });
    } else if (modResult.isSuspicious) {
      // Content temporarily hidden / flagged
      newQuestion.status = 'flagged';
      newQuestion.moderationStatus = 'flagged';
      await newQuestion.save();

      // Create medium-severity AI report
      await Report.create({
        targetType: 'question',
        targetId: newQuestion._id,
        reportedBy: null,
        type: 'abuse',
        description: `${modResult.reason} (Auto-Moderation flagged suspicious content)`,
        aiSeverity: 'medium',
        status: 'open'
      });

      return res.status(201).json({
        success: true,
        message: 'Your question has been received and is currently under moderator review.',
        data: newQuestion
      });
    } else {
      // Content is safe
      newQuestion.status = 'unresolved';
      newQuestion.moderationStatus = 'approved';
      await newQuestion.save();

      return res.status(201).json({
        success: true,
        data: newQuestion
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // View count bump (increment views)
    const question = await Question.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    )
    .populate('author', 'username name avatar role badgeLevel')
    .populate('category', 'name')
    .populate('linkedBestAnswerId');

    if (!question || question.status === 'deleted') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Question not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

export const toggleHelpfulVote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Question not found' }
      });
    }

    const voteIndex = question.helpfulVotes.findIndex(id => id.toString() === userId.toString());
    if (voteIndex === -1) {
      // Add vote
      question.helpfulVotes.push(userId);
    } else {
      // Remove vote
      question.helpfulVotes.splice(voteIndex, 1);
    }
    
    question.helpfulVotesCount = question.helpfulVotes.length;
    await question.save();

    return res.status(200).json({
      success: true,
      data: {
        helpfulVotesCount: question.helpfulVotesCount,
        hasVoted: voteIndex === -1 // true if we just added it
      }
    });
  } catch (error) {
    next(error);
  }
};

export const editQuestion = async (req, res, next) => {
  try {
    // req.resource is pre-fetched by requireOwnerOrRole middleware
    const question = req.resource;
    const { title, body, tags, category } = req.body;

    if (title) {
      question.title = title;
      try {
        const embedding = await generateEmbedding(title);
        if (embedding) {
          question.embedding = embedding;
        }
      } catch (err) {
        console.error("[VectorSearch] Failed to generate embedding during edit:", err.message);
      }
    }
    if (body) question.body = body;
    if (tags) question.tags = tags;
    if (category) question.category = category;

    await question.save();

    return res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    // req.resource is pre-fetched by requireOwnerOrRole middleware
    const question = req.resource;
    
    // Soft-delete question
    question.status = 'deleted';
    await question.save();

    // Log action if deleted by Admin/Mod
    if (req.user.role !== 'user') {
      await AuditLog.create({
        action: 'delete_question',
        performedBy: req.user.userId,
        targetType: 'question',
        targetId: question._id,
        details: { title: question.title }
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const changeQuestionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status value'
        }
      });
    }

    const question = await Question.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Question not found'
        }
      });
    }

    await AuditLog.create({
      action: 'change_question_status',
      performedBy: req.user.userId,
      targetType: 'question',
      targetId: question._id,
      details: { status }
    });

    return res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

export const promoteQuestionToFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Question not found'
        }
      });
    }

    // A question needs a linkedBestAnswerId to be promoted to FAQ
    if (!question.linkedBestAnswerId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Question must have a verified best answer before FAQ promotion'
        }
      });
    }

    question.isFAQ = true;
    question.status = 'resolved';
    question.acceptedAnswerId = question.linkedBestAnswerId;
    await question.save();

    await AuditLog.create({
      action: 'promote_faq',
      performedBy: req.user.userId,
      targetType: 'question',
      targetId: question._id,
      details: { title: question.title }
    });

    return res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

export const revertFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await Question.findByIdAndUpdate(
      id,
      { isFAQ: false },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Question not found'
        }
      });
    }

    await AuditLog.create({
      action: 'revert_faq',
      performedBy: req.user.userId,
      targetType: 'question',
      targetId: question._id,
      details: { title: question.title }
    });

    return res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

export const getFAQs = async (req, res, next) => {
  try {
    const questions = await Question.find({ isFAQ: true, status: { $ne: 'deleted' } })
      .populate('author', 'username name avatar')
      .populate('category', 'name')
      .populate('linkedBestAnswerId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

export const getSimilarQuestions = async (req, res, next) => {
  try {
    const { title, body } = req.query;
    if (!title) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title is required for similarity checks'
        }
      });
    }

    const matches = await findSimilarQuestions(title, body || '');
    return res.status(200).json({
      success: true,
      data: matches.slice(0, 5) // Return top 5 matches
    });
  } catch (error) {
    next(error);
  }
};

export const getDuplicateQuestions = async (req, res, next) => {
  try {
    const { title, organizationId, tags, category } = req.body;
    if (!title) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title is required for duplicate checking'
        }
      });
    }

    const matches = await findDuplicateQuestions(title, organizationId, tags || [], category);
    return res.status(200).json({
      success: true,
      data: matches.slice(0, 5) // Return top 5 matches
    });
  } catch (error) {
    next(error);
  }
};
