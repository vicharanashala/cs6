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
