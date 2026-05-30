import dotenv from 'dotenv';
dotenv.config();

/**
 * Generates a deterministic mock embedding of specified dimension
 * seeded by the input text. Ensures stable vector search matching offline.
 * @param {string} text 
 * @param {number} dim 
 * @returns {Array<number>} Normalized float vector
 */
export const generateMockEmbedding = (text, dim = 768) => {
  const result = new Array(dim);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let state = Math.abs(hash) || 987654321;

  for (let i = 0; i < dim; i++) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    result[i] = (state / 4294967296) * 2 - 1;
  }

  // Normalize the vector
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += result[i] * result[i];
  }
  norm = Math.sqrt(norm) || 1.0;
  for (let i = 0; i < dim; i++) {
    result[i] /= norm;
  }

  return result;
};

export const hasKey = (val) => {
  return val && typeof val === 'string' && val.trim() !== '' && val !== 'undefined' && val !== 'null';
};

/**
 * Returns the active embedding dimension depending on configuration keys
 * @returns {number} 1536 for OpenAI, 768 for Gemini, 384 for Hugging Face
 */
export const getEmbeddingDimension = () => {
  if (hasKey(process.env.OPENAI_API_KEY)) {
    return 1536;
  }
  if (hasKey(process.env.GEMINI_API_KEY)) {
    return 768;
  }
  if (hasKey(process.env.HF_TOKEN)) {
    return 384;
  }
  return 768; // Default to Gemini dimension
};

let activeGeminiModel = null;

/**
 * Dynamically discovers the active Gemini model and caches it
 * @returns {Promise<string>} Chosen model name (e.g. models/gemini-embedding-2)
 */
export const discoverGeminiModel = async () => {
  if (activeGeminiModel) return activeGeminiModel;
  if (!hasKey(process.env.GEMINI_API_KEY)) return null;

  const candidates = [
    "models/gemini-embedding-2",
    "models/text-embedding-004",
    "models/gemini-embedding-001"
  ];

  for (const model of candidates) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${model}:embedContent?key=${process.env.GEMINI_API_KEY.trim()}`,
        {
          headers: { "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({
            content: { parts: [{ text: "test" }] },
            outputDimensionality: 768
          }),
          signal: AbortSignal.timeout(2000)
        }
      );
      if (response.ok) {
        const json = await response.json();
        if (json.embedding && Array.isArray(json.embedding.values)) {
          activeGeminiModel = model;
          console.log(`[Embeddings] Successfully selected active Gemini model: ${model}`);
          return model;
        }
      }
    } catch (e) {
      // Ignore and check next candidate
    }
  }

  // Fallback to text-embedding-004 if all fail
  activeGeminiModel = "models/text-embedding-004";
  return activeGeminiModel;
};

/**
 * Generate embedding vector for a given text using active API or local fallback
 * @param {string} text 
 * @returns {Promise<Array<number>>} Vector array
 */
export const generateEmbedding = async (text) => {
  if (!text || !text.trim()) {
    return generateMockEmbedding('', getEmbeddingDimension());
  }

  const dim = getEmbeddingDimension();

  // 1. OPENAI EMBEDDINGS
  if (hasKey(process.env.OPENAI_API_KEY)) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        method: "POST",
        body: JSON.stringify({
          input: text,
          model: "text-embedding-3-small"
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const json = await response.json();
        if (json.data && json.data[0] && Array.isArray(json.data[0].embedding)) {
          return json.data[0].embedding;
        }
      }
      throw new Error(`OpenAI embedding failed with status ${response.status}`);
    } catch (err) {
      console.warn(`OpenAI embedding failed: ${err.message}`);
      throw err;
    }
  }

  // 2. GEMINI EMBEDDINGS
  if (hasKey(process.env.GEMINI_API_KEY)) {
    try {
      const model = await discoverGeminiModel();
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${model}:embedContent?key=${process.env.GEMINI_API_KEY.trim()}`,
        {
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST",
          body: JSON.stringify({
            content: {
              parts: [{ text }]
            },
            outputDimensionality: dim
          }),
          signal: AbortSignal.timeout(5000)
        }
      );

      if (response.ok) {
        const json = await response.json();
        if (json.embedding && Array.isArray(json.embedding.values)) {
          return json.embedding.values;
        }
      }
      throw new Error(`Gemini embedding failed with status ${response.status}`);
    } catch (err) {
      console.warn(`Gemini embedding failed: ${err.message}`);
      throw err;
    }
  }

  // 3. HUGGING FACE EMBEDDINGS
  if (hasKey(process.env.HF_TOKEN)) {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.HF_TOKEN}`
          },
          method: "POST",
          body: JSON.stringify({ inputs: text }),
          signal: AbortSignal.timeout(5000)
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result)) {
          return result;
        }
      }
      throw new Error(`Hugging Face embedding failed with status ${response.status}`);
    } catch (err) {
      console.warn(`Hugging Face embedding failed: ${err.message}`);
      throw err;
    }
  }

  // 4. OFFLINE DETOUR FALLBACK (FINAL RELOAD TRIGGER)
  return generateMockEmbedding(text, dim);
};

// Trigger server reload to run migration on empty embeddings

