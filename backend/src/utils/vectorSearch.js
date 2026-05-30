import mongoose from 'mongoose';
import Question from '../models/Question.js';
import { generateEmbedding, getEmbeddingDimension, hasKey } from './embeddings.js';

/**
 * Initializes the MongoDB Atlas Vector Search Index programmatically
 * on the 'questions' collection if it does not already exist.
 */
export const initializeVectorIndex = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.warn("Database connection is not ready for Vector Index initialization.");
      return;
    }

    const collection = db.collection('questions');
    const dim = getEmbeddingDimension();

    console.log(`[VectorSearch] Checking Vector Search Index state for 'questions' (Dimension: ${dim})...`);
    
    let searchIndexes = [];
    try {
      searchIndexes = await collection.listSearchIndexes().toArray();
    } catch (err) {
      console.warn(`[VectorSearch] listSearchIndexes is not supported. Skipping programmatical index creation. Error: ${err.message}`);
      return;
    }

    const exists = searchIndexes.some(idx => idx.name === 'vector_index');
    if (exists) {
      console.log("[VectorSearch] Index 'vector_index' already configured on 'questions' collection.");
      return;
    }

    console.log("[VectorSearch] Creating 'vector_index' search index on 'questions' collection...");
    await collection.createSearchIndex({
      name: "vector_index",
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: dim,
            similarity: "cosine"
          }
        ]
      }
    });
    console.log("[VectorSearch] Search index 'vector_index' creation request submitted successfully.");
  } catch (error) {
    console.warn(`[VectorSearch] Failed to initialize search index programmatically: ${error.message}`);
  }
};

/**
 * Startup migration to backfill embedding vectors for existing question documents
 * that do not have them stored yet.
 */
export const syncExistingEmbeddings = async () => {
  try {
    console.log("[VectorSearch] Scanning questions database for missing embeddings...");
    const missing = await Question.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: null }
      ]
    });

    if (missing.length === 0) {
      console.log("[VectorSearch] All questions have embedding vectors populated. Sync complete.");
      return;
    }

    console.log(`[VectorSearch] Backfilling embeddings for ${missing.length} questions...`);
    let count = 0;
    const isRealAPI = hasKey(process.env.GEMINI_API_KEY) || hasKey(process.env.OPENAI_API_KEY) || hasKey(process.env.HF_TOKEN);

    for (const q of missing) {
      try {
        const embedding = await generateEmbedding(q.title);
        await Question.updateOne(
          { _id: q._id },
          { $set: { embedding } }
        );
        count++;

        // Add rate-limiting delay to respect the free-tier 15 RPM limit
        if (isRealAPI) {
          await new Promise(resolve => setTimeout(resolve, 4500));
        }
      } catch (err) {
        console.error(`[VectorSearch] Failed to generate embedding for question ${q._id}: ${err.message}`);
        // Delay on error to allow the API to cool down
        if (isRealAPI) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    console.log(`[VectorSearch] Successfully backfilled embeddings for ${count}/${missing.length} questions.`);
  } catch (error) {
    console.error(`[VectorSearch] Sync embeddings task failed with error: ${error.message}`);
  }
};
