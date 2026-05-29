import Fuse from 'fuse.js';
import Question from '../models/Question.js';

/**
 * Find similar questions using Fuse.js fuzzy search
 * @param {string} title 
 * @param {string} body 
 * @returns {Promise<Array>} List of similar questions with score
 */
export const findSimilarQuestions = async (title, body = '') => {
  // Fetch active questions from the database
  const questions = await Question.find({ status: { $ne: 'deleted' } }).lean();

  if (questions.length === 0) return [];

  // Configure Fuse.js
  const options = {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'body', weight: 0.3 }
    ],
    includeScore: true,
    threshold: 0.6 // general threshold for fuzzy search
  };

  const fuse = new Fuse(questions, options);
  
  // Perform search
  const results = fuse.search(title);

  // Return formatted results
  return results.map(r => ({
    question: r.item,
    score: r.score // 0.0 is perfect match, 1.0 is no match
  }));
};

/**
 * Check if a question is a duplicate (score < threshold)
 * @param {string} title 
 * @param {string} body 
 * @param {number} threshold Default 0.4
 * @returns {Promise<{isDuplicate: boolean, topMatch: Object}>}
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
    topMatch: null
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

  const options = {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'tags', weight: 0.3 }
    ],
    includeScore: true,
    threshold: 0.6
  };

  const fuse = new Fuse(questions, options);
  const results = fuse.search(title);

  return results.map(r => ({
    _id: r.item._id,
    title: r.item.title,
    isFAQ: r.item.isFAQ || false,
    similarity: Math.round((1 - r.score) * 100),
    link: `/questions/${r.item._id}`
  }));
};
