// embeddingService: wraps Jina embeddings API with retry and a deterministic demo fallback when API key is missing.
// Exports `generateEmbeddings` (batch) and `generateEmbedding` (single) for downstream use.
const axios = require("axios");

const JINA_API_KEY = process.env.JINA_API_KEY;
const JINA_URL = "https://api.jina.ai/v1/embeddings";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

let useDemoFallback = false;
if (!JINA_API_KEY) {
  // If no Jina API key is present, the service will use a deterministic demo fallback.
  // This allows the project to run and be demoed without external credentials.
  console.warn('Missing JINA_API_KEY in environment — using demo fallback embeddings');
  useDemoFallback = true;
}

const _callJina = async (inputs) => {
  if (useDemoFallback) {
    // deterministic fallback: return zero vectors of length 768
    return {
      data: inputs.map(() => ({ embedding: Array(768).fill(0) }))
    };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        JINA_URL,
        {
          model: "jina-embeddings-v2-base-en",
          input: inputs
        },
        {
          headers: {
            Authorization: `Bearer ${JINA_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (err) {
      console.error(`Jina call failed on attempt ${attempt}:`, err.response?.data || err.message);
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }
  }
};

/**
 * generateEmbeddings - accepts string or array of strings and returns embedding(s)
 * If input is a single string returns an array of numbers; if array, returns array of embeddings
 */
const generateEmbeddings = async (texts) => {
  const inputs = Array.isArray(texts) ? texts : [texts];
  const data = await _callJina(inputs);

  if (!data || !data.data || !Array.isArray(data.data) || data.data.length !== inputs.length) {
    throw new Error("Invalid response from Jina embeddings API");
  }

  const embeddings = data.data.map((d) => d.embedding);

  embeddings.forEach((e, idx) => {
    if (!Array.isArray(e) || e.length === 0) {
      throw new Error(`Invalid embedding for input index ${idx}`);
    }
  });

  return Array.isArray(texts) ? embeddings : embeddings[0];
};

const generateEmbedding = async (text) => {
  return generateEmbeddings(text);
};

module.exports = { generateEmbeddings, generateEmbedding };
