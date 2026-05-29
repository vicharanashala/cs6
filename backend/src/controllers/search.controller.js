import Question from '../models/Question.js';
import Fuse from 'fuse.js';

export const unifiedSearch = async (req, res, next) => {
  try {
    const { q = '', type = 'all', category, tag, limit = 10 } = req.query;

    const queryLimit = parseInt(limit, 10) || 10;

    // Build base filter
    const filter = { status: { $ne: 'deleted' } };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;

    let results = [];

    if (q.trim()) {
      // 1. Keyword search via MongoDB Text Index
      const textQuery = { ...filter, $text: { $search: q } };
      const textResults = await Question.find(textQuery)
        .populate('author', 'username name avatar')
        .populate('category', 'name')
        .lean();

      // 2. Fuzzy search via Fuse.js
      const allQuestions = await Question.find(filter)
        .populate('author', 'username name avatar')
        .populate('category', 'name')
        .lean();

      const fuse = new Fuse(allQuestions, {
        keys: [
          { name: 'title', weight: 0.7 },
          { name: 'body', weight: 0.3 }
        ],
        threshold: 0.5
      });

      const fuzzyResults = fuse.search(q).map(r => r.item);

      // 3. Merge and Rank (keep text index hits first, then append distinct fuzzy hits)
      const mergedMap = new Map();
      textResults.forEach(item => mergedMap.set(item._id.toString(), item));
      fuzzyResults.forEach(item => {
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
