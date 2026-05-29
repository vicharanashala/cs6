import Fuse from 'fuse.js';
import Question from '../models/Question.js';
import { 
  getExpandedTokens, 
  calculateSemanticSimilarity, 
  calculateIntentCompatibility,
  getCategoryMap
} from '../utils/semantic.js';

/**
 * Find similar questions using hybrid semantic + Fuse.js fuzzy search
 * @param {string} title 
 * @param {string} body 
 * @returns {Promise<Array>} List of similar questions with score
 */
export const findSimilarQuestions = async (title, body = '') => {
  // Fetch active questions from the database
  const questions = await Question.find({ status: { $ne: 'deleted' } }).lean();

  if (questions.length === 0) return [];

  // 1. Perform Fuse.js search for fuzzy text match
  const options = {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'body', weight: 0.3 }
    ],
    includeScore: true,
    threshold: 0.6
  };

  const fuse = new Fuse(questions, options);
  const fuseResults = fuse.search(title);

  const fuseMap = new Map();
  for (const r of fuseResults) {
    fuseMap.set(r.item._id.toString(), 1 - r.score); // convert distance to similarity (0.0 to 1.0)
  }

  // 2. Compute semantic tokens for query
  const queryText = `${title} ${body}`;
  const queryExpanded = getExpandedTokens(queryText, [], true);
  const categoryMap = await getCategoryMap();

  // 3. Score questions
  const ranked = questions.map(q => {
    const docText = `${q.title} ${q.body || ''}`;
    const docExpanded = getExpandedTokens(docText, q.tags || [], false);

    const semanticJaccard = calculateSemanticSimilarity(queryExpanded.tokens, docExpanded.tokens);
    const intentComp = calculateIntentCompatibility(queryExpanded.intents, docExpanded.intents);
    const semanticCloseness = semanticJaccard * intentComp;

    const fuseSimilarity = fuseMap.get(q._id.toString()) || 0;

    // Weight semantic closeness at 70% and Fuse.js literal similarity at 30%
    let score = (0.7 * semanticCloseness) + (0.3 * fuseSimilarity);

    // Boosts
    // Category match check
    if (q.category) {
      const catName = categoryMap.get(q.category.toString());
      if (catName && (title.toLowerCase().includes(catName) || body.toLowerCase().includes(catName))) {
        score += 0.05;
      }
    }

    // Factual usefulness boost
    if (q.isFAQ) score += 0.08;
    if (q.linkedBestAnswerId || q.acceptedAnswerId) score += 0.05;
    score += Math.min(0.02, (q.views || 0) / 1000);

    // Recency boost
    const ageInDays = (new Date() - new Date(q.createdAt)) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, 0.05 * (1 - ageInDays / 365));
    score += recencyBoost;

    // Cap score at 1.0
    const finalSimilarity = Math.min(1.0, score);

    return {
      question: q,
      // Fuse.js distance format: 0.0 is perfect, 1.0 is no match. So we return (1 - finalSimilarity)
      score: 1 - finalSimilarity
    };
  });

  // Sort by score ascending (lowest distance first)
  return ranked.sort((a, b) => a.score - b.score);
};

/**
 * Check if a question is a duplicate (score < threshold in distance)
 * @param {string} title 
 * @param {string} body 
 * @param {number} threshold Default 0.4 (i.e. similarity > 60%)
 * @returns {Promise<{isDuplicate: boolean, topMatch: Object, score: number}>}
 */
export const checkDuplicate = async (title, body = '', threshold = 0.4) => {
  const matches = await findSimilarQuestions(title, body);
  
  if (matches.length > 0 && matches[0].score < threshold) {
    return {
      isDuplicate: true,
      topMatch: matches[0].question,
      score: matches[0].score
    };
  }

  return {
    isDuplicate: false,
    topMatch: null,
    score: matches.length > 0 ? matches[0].score : 1.0
  };
};

/**
 * Find duplicate questions restricted to an organization and rank them with similarity scores
 * @param {string} title 
 * @param {string} organizationId 
 * @param {Array<string>} tags 
 * @returns {Promise<Array>} List of duplicates with similarity metrics
 */
export const findDuplicateQuestions = async (title, organizationId, tags = []) => {
  const filter = { status: { $ne: 'deleted' } };
  if (organizationId) {
    filter.organizationId = organizationId;
  }

  const questions = await Question.find(filter).lean();

  if (questions.length === 0) return [];

  // Perform Fuse.js fuzzy check on title/tags
  const options = {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'tags', weight: 0.3 }
    ],
    includeScore: true,
    threshold: 0.6
  };

  const fuse = new Fuse(questions, options);
  const fuseResults = fuse.search(title);

  const fuseMap = new Map();
  for (const r of fuseResults) {
    fuseMap.set(r.item._id.toString(), 1 - r.score);
  }

  const queryExpanded = getExpandedTokens(title, tags, true);
  const categoryMap = await getCategoryMap();

  const suggestions = questions.map(q => {
    const docExpanded = getExpandedTokens(q.title, q.tags || [], false);
    
    const semanticJaccard = calculateSemanticSimilarity(queryExpanded.tokens, docExpanded.tokens);
    const intentComp = calculateIntentCompatibility(queryExpanded.intents, docExpanded.intents);
    const semanticCloseness = semanticJaccard * intentComp;
    
    const fuseSimilarity = fuseMap.get(q._id.toString()) || 0;

    // Weight semantic closeness heavily (70%) and literal text similarity (30%)
    let score = (0.7 * semanticCloseness) + (0.3 * fuseSimilarity);

    // Apply boosts
    if (q.category) {
      const catName = categoryMap.get(q.category.toString());
      if (catName && title.toLowerCase().includes(catName)) {
        score += 0.05;
      }
    }

    // Factual usefulness boost
    if (q.isFAQ) score += 0.08;
    if (q.linkedBestAnswerId || q.acceptedAnswerId) score += 0.05;
    score += Math.min(0.02, (q.views || 0) / 1000);

    // Recency boost
    const ageInDays = (new Date() - new Date(q.createdAt)) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, 0.05 * (1 - ageInDays / 365));
    score += recencyBoost;

    const similarityPercentage = Math.round(Math.min(1.0, score) * 100);

    return {
      _id: q._id,
      title: q.title,
      isFAQ: q.isFAQ || false,
      similarity: similarityPercentage,
      link: `/questions/${q._id}`
    };
  });

  // Filter out unrelated queries (score < 20%) and sort by relevance descending
  return suggestions
    .filter(s => s.similarity >= 20)
    .sort((a, b) => b.similarity - a.similarity);
};
