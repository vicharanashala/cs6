import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Fuse from 'fuse.js';
import {
  getExpandedTokens,
  calculateSemanticSimilarity,
  calculateIntentCompatibility,
  getCategoryMap
} from '../utils/semantic.js';

export const unifiedSearch = async (req, res, next) => {
  try {
    const { q = '', type = 'all', category, limit = 10 } = req.query;

    const queryLimit = parseInt(limit, 10) || 10;

    // Build base filter
    const filter = { status: { $ne: 'deleted' } };
    if (category) filter.category = category;

    let results = [];

    if (q.trim()) {
      // 1. Fetch active questions and visible answers
      const questions = await Question.find(filter)
        .populate('author', 'username name avatar')
        .populate('category', 'name')
        .lean();

      const answers = await Answer.find({ status: 'visible' }).lean();

      // Map questionId -> array of answer bodies
      const answerMap = new Map();
      for (const ans of answers) {
        const qId = ans.questionId.toString();
        if (!answerMap.has(qId)) answerMap.set(qId, []);
        answerMap.get(qId).push(ans.body);
      }

      // 2. Perform fuzzy string search with Fuse.js
      const options = {
        keys: [
          { name: 'title', weight: 0.6 },
          { name: 'body', weight: 0.4 }
        ],
        includeScore: true,
        threshold: 0.6
      };

      const fuse = new Fuse(questions, options);
      const fuseResults = fuse.search(q.trim());

      const fuseMap = new Map();
      for (const r of fuseResults) {
        fuseMap.set(r.item._id.toString(), 1 - r.score);
      }

      // 3. Compute semantic tokens and ranking
      const queryExpanded = getExpandedTokens(q.trim(), [], true);
      const categoryMap = await getCategoryMap();

      const rankedQuestions = questions.map(question => {
        // Build document tokens (Title + Body + Tags + Answers)
        const docText = `${question.title} ${question.body || ''}`;
        const docExpanded = getExpandedTokens(docText, question.tags || [], false);
        
        // Add answer tokens for context-based matching
        const ansBodies = answerMap.get(question._id.toString()) || [];
        ansBodies.forEach(body => {
          const ansExpanded = getExpandedTokens(body, [], false);
          ansExpanded.tokens.forEach(t => docExpanded.tokens.add(t));
          ansExpanded.intents.forEach(i => docExpanded.intents.add(i));
        });

        // Compute semantic Jaccard similarity
        const semanticJaccard = calculateSemanticSimilarity(queryExpanded.tokens, docExpanded.tokens);
        const intentComp = calculateIntentCompatibility(queryExpanded.intents, docExpanded.intents);
        const semanticCloseness = semanticJaccard * intentComp;

        // Retrieve Fuse.js fuzzy string match
        const fuseSimilarity = fuseMap.get(question._id.toString()) || 0;

        // Weight semantic closeness heavily (70%) and literal text similarity (30%)
        let score = (0.7 * semanticCloseness) + (0.3 * fuseSimilarity);

        // Boosts
        // Category match check
        if (question.category) {
          const catId = question.category._id ? question.category._id.toString() : question.category.toString();
          const catName = categoryMap.get(catId) || (question.category.name ? question.category.name.toLowerCase() : "");
          if (catName && q.toLowerCase().includes(catName)) {
            score += 0.05;
          }
        }

        // Factual usefulness boost
        if (question.isFAQ) score += 0.08;
        if (question.linkedBestAnswerId || question.acceptedAnswerId) score += 0.05;
        score += Math.min(0.02, (question.views || 0) / 1000);

        // Apply slight recency boost
        const ageInDays = (new Date() - new Date(question.createdAt)) / (1000 * 60 * 60 * 24);
        const recencyBoost = Math.max(0, 0.05 * (1 - ageInDays / 365)); // Up to 5% boost for posts within 1 year
        const finalScore = Math.min(1.0, score + recencyBoost);

        return {
          ...question,
          score: finalScore
        };
      });

      // Filter out completely unrelated queries (score < 0.15) and sort by score descending
      results = rankedQuestions
        .filter(q => q.score >= 0.15)
        .sort((a, b) => b.score - a.score);

    } else {
      // No query: return general list sorted by createdAt descending
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
