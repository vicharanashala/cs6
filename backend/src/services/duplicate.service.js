import Fuse from 'fuse.js';
import mongoose from 'mongoose';
import Question from '../models/Question.js';
import { 
  getExpandedTokens, 
  calculateSemanticSimilarity, 
  calculateIntentCompatibility,
  getCategoryMap
} from '../utils/semantic.js';
import { generateEmbedding } from '../utils/embeddings.js';

/**
 * Find similar questions using hybrid semantic + Fuse.js fuzzy search
 * @param {string} title 
 * @param {string} body 
 * @returns {Promise<Array>} List of similar questions with score
 */
export const findSimilarQuestions = async (title, body = '') => {
  // Try MongoDB Atlas Vector Search first
  try {
    const queryEmbedding = await generateEmbedding(title);
    if (queryEmbedding && Array.isArray(queryEmbedding)) {
      const pipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: 10
          }
        },
        {
          $project: {
            author: 1,
            organizationId: 1,
            title: 1,
            body: 1,
            tags: 1,
            category: 1,
            status: 1,
            isFAQ: 1,
            linkedBestAnswerId: 1,
            acceptedAnswerId: 1,
            views: 1,
            moderationStatus: 1,
            createdAt: 1,
            score: { $meta: "vectorSearchScore" }
          }
        },
        {
          $match: { status: { $ne: 'deleted' } }
        }
      ];

      const dbResults = await Question.aggregate(pipeline);
      if (dbResults && dbResults.length > 0) {
        const ranked = dbResults.map(q => {
          // MongoDB vectorSearchScore for cosine = (1 + cosine_similarity) / 2
          // so cosine_similarity = 2 * score - 1, typically in [0.5, 1.0] range
          const cosine = Math.max(0, 2 * q.score - 1);

          // Rescale: the noise floor for unrelated text is ~0.50 cosine.
          // Map [0.50, 1.0] → [0.0, 1.0] so unrelated content starts near 0%
          const FLOOR = 0.50;
          const baseSimilarity = Math.max(0, (cosine - FLOOR) / (1.0 - FLOOR));

          // Apply small multiplicative boosts for metadata relevance
          let boost = 1.0;
          if (q.isFAQ) boost += 0.10;
          if (q.linkedBestAnswerId || q.acceptedAnswerId) boost += 0.06;
          boost += Math.min(0.03, (q.views || 0) / 5000);

          const ageInDays = (new Date() - new Date(q.createdAt)) / (1000 * 60 * 60 * 24);
          boost += Math.max(0, 0.05 * (1 - ageInDays / 365));

          const finalSimilarity = Math.min(1.0, baseSimilarity * boost);

          return {
            question: q,
            score: 1 - finalSimilarity
          };
        });
        return ranked.sort((a, b) => a.score - b.score);
      }
    }
  } catch (err) {
    console.warn("[VectorSearch] findSimilarQuestions query failed. Falling back to local NLP search. Error:", err.message);
  }

  // Fallback to local Jaccard + Overlap NLP search
  const questions = await Question.find({ status: { $ne: 'deleted' } }).lean();
  if (questions.length === 0) return [];

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
    fuseMap.set(r.item._id.toString(), 1 - r.score);
  }

  const queryText = `${title} ${body}`;
  const queryExpanded = getExpandedTokens(queryText, [], true);
  const categoryMap = await getCategoryMap();

  const ranked = questions.map(q => {
    const docText = `${q.title} ${q.body || ''}`;
    const docExpanded = getExpandedTokens(docText, q.tags || [], false);

    const semanticJaccard = calculateSemanticSimilarity(queryExpanded.tokens, docExpanded.tokens);
    const intentComp = calculateIntentCompatibility(queryExpanded.intents, docExpanded.intents);
    const semanticCloseness = semanticJaccard * intentComp;

    const fuseSimilarity = fuseMap.get(q._id.toString()) || 0;
    let score = (0.7 * semanticCloseness) + (0.3 * fuseSimilarity);

    if (q.category) {
      const catName = categoryMap.get(q.category.toString());
      if (catName && (title.toLowerCase().includes(catName) || body.toLowerCase().includes(catName))) {
        score += 0.05;
      }
    }

    if (q.isFAQ) score += 0.08;
    if (q.linkedBestAnswerId || q.acceptedAnswerId) score += 0.05;
    score += Math.min(0.02, (q.views || 0) / 1000);

    const ageInDays = (new Date() - new Date(q.createdAt)) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, 0.05 * (1 - ageInDays / 365));
    score += recencyBoost;

    const finalSimilarity = Math.min(1.0, score);

    return {
      question: q,
      score: 1 - finalSimilarity
    };
  });

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
export const findDuplicateQuestions = async (title, organizationId, tags = [], category = null) => {
  // Try MongoDB Atlas Vector Search first
  try {
    const queryEmbedding = await generateEmbedding(title);
    if (queryEmbedding && Array.isArray(queryEmbedding)) {
      const pipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: 10
          }
        },
        {
          $project: {
            title: 1,
            isFAQ: 1,
            status: 1,
            organizationId: 1,
            category: 1,
            linkedBestAnswerId: 1,
            acceptedAnswerId: 1,
            views: 1,
            createdAt: 1,
            tags: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ];

      const matchConditions = { status: { $ne: 'deleted' } };
      if (organizationId) {
        if (mongoose.Types.ObjectId.isValid(organizationId)) {
          matchConditions.organizationId = new mongoose.Types.ObjectId(organizationId);
        } else {
          matchConditions.organizationId = organizationId;
        }
      }
      pipeline.push({ $match: matchConditions });

      const dbResults = await Question.aggregate(pipeline);
      if (dbResults && dbResults.length > 0) {
        const categoryMap = await getCategoryMap();
        const suggestions = dbResults.map(q => {
          // MongoDB vectorSearchScore for cosine = (1 + cosine_similarity) / 2
          const cosine = Math.max(0, 2 * q.score - 1);

          // Rescale: noise floor for unrelated text is ~0.50 cosine
          // Map [0.50, 1.0] → [0.0, 1.0]
          const FLOOR = 0.50;
          const baseSimilarity = Math.max(0, (cosine - FLOOR) / (1.0 - FLOOR));

          // Multiplicative boosts for metadata relevance
          let boost = 1.0;
          if (q.category) {
            const catName = categoryMap.get(q.category.toString());
            if (catName && title.toLowerCase().includes(catName)) {
              boost += 0.06;
            }
            if (category && q.category.toString() === category.toString()) {
              boost += 0.18;
            }
          }
          if (q.isFAQ) boost += 0.10;
          if (q.linkedBestAnswerId || q.acceptedAnswerId) boost += 0.06;
          boost += Math.min(0.03, (q.views || 0) / 5000);

          const ageInDays = (new Date() - new Date(q.createdAt)) / (1000 * 60 * 60 * 24);
          boost += Math.max(0, 0.05 * (1 - ageInDays / 365));

          const similarityPercentage = Math.round(Math.min(1.0, baseSimilarity * boost) * 100);

          return {
            _id: q._id,
            title: q.title,
            isFAQ: q.isFAQ || false,
            similarity: similarityPercentage,
            link: `/questions/${q._id}`
          };
        });

        return suggestions
          .filter(s => s.similarity >= 20)
          .sort((a, b) => b.similarity - a.similarity);
      }
    }
  } catch (err) {
    console.warn("[VectorSearch] findDuplicateQuestions query failed. Falling back to local NLP search. Error:", err.message);
  }

  // Fallback to local Jaccard + Overlap NLP search
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
    let score = (0.7 * semanticCloseness) + (0.3 * fuseSimilarity);

    if (q.category) {
      const catName = categoryMap.get(q.category.toString());
      if (catName && title.toLowerCase().includes(catName)) {
        score += 0.05;
      }
      if (category && q.category.toString() === category.toString()) {
        score += 0.15;
      }
    }

    if (q.isFAQ) score += 0.08;
    if (q.linkedBestAnswerId || q.acceptedAnswerId) score += 0.05;
    score += Math.min(0.02, (q.views || 0) / 1000);

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

  return suggestions
    .filter(s => s.similarity >= 20)
    .sort((a, b) => b.similarity - a.similarity);
};
