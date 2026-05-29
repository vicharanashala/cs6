import Question from '../models/Question.js';
import Answer from '../models/Answer.js';

export const unifiedSearch = async (req, res, next) => {
  try {
    const { q = '', type = 'all', category, limit = 10 } = req.query;

    const queryLimit = parseInt(limit, 10) || 10;

    // Build base filter
    const filter = { status: { $ne: 'deleted' } };
    if (category) filter.category = category;

    let results = [];

    if (q.trim()) {
      const regex = new RegExp(q.trim(), 'i');

      // 1. Direct search on question titles and bodies
      const matchedQuestions = await Question.find({
        ...filter,
        $or: [
          { title: regex },
          { body: regex }
        ]
      })
      .populate('author', 'username name avatar')
      .populate('category', 'name')
      .lean();

      // 2. Search answer bodies and find their parent questions
      const matchedAnswers = await Answer.find({
        body: regex,
        status: 'visible'
      })
      .select('questionId')
      .lean();

      const questionIdsFromAnswers = matchedAnswers.map(ans => ans.questionId.toString());

      let questionsFromAnswers = [];
      if (questionIdsFromAnswers.length > 0) {
        questionsFromAnswers = await Question.find({
          ...filter,
          _id: { $in: questionIdsFromAnswers }
        })
        .populate('author', 'username name avatar')
        .populate('category', 'name')
        .lean();
      }

      // 3. Merge results uniquely
      const mergedMap = new Map();
      matchedQuestions.forEach(item => mergedMap.set(item._id.toString(), item));
      questionsFromAnswers.forEach(item => {
        const idStr = item._id.toString();
        if (!mergedMap.has(idStr)) {
          mergedMap.set(idStr, item);
        }
      });

      results = Array.from(mergedMap.values());
    } else {
      // No query: return general list
      results = await Question.find(filter)
        .populate('author', 'username name avatar')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Categorize
    const faqs = [];
    const questions = [];

    results.forEach(item => {
      if (item.isFAQ) {
        faqs.push(item);
      } else {
        questions.push(item);
      }
    });

    // Filter by type filter
    let finalFaqs = faqs;
    let finalQuestions = questions;

    if (type === 'faq') {
      finalQuestions = [];
    } else if (type === 'question') {
      finalFaqs = [];
    }

    // Apply limit
    finalFaqs = finalFaqs.slice(0, queryLimit);
    finalQuestions = finalQuestions.slice(0, queryLimit);

    const totalResults = finalFaqs.length + finalQuestions.length;

    return res.status(200).json({
      success: true,
      data: {
        faqs: finalFaqs,
        questions: finalQuestions
      },
      meta: {
        query: q,
        totalResults
      }
    });
  } catch (error) {
    next(error);
  }
};

export const autocompleteTags = async (req, res, next) => {
  try {
    const { q } = req.query;

    // Get all unique tags in active questions
    const questions = await Question.find({ status: { $ne: 'deleted' } }).select('tags').lean();
    const tags = [...new Set(questions.flatMap(q => q.tags || []))];

    // Filter suggestions
    const suggestions = q
      ? tags.filter(t => t.toLowerCase().includes(q.toLowerCase()))
      : tags;

    return res.status(200).json({
      success: true,
      data: suggestions.slice(0, 10) // Limit to 10 suggestions
    });
  } catch (error) {
    next(error);
  }
};
