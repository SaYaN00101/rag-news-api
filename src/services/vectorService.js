// vectorService: REST helpers for Qdrant to initialize collections, add documents (with embeddings), and search.
// Uses `generateEmbedding` from `embeddingService`. Keeps logic simple for the assessment demo.
const axios = require("axios");
const { generateEmbedding } = require("./embeddingService");

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'news_vectors';
const VECTOR_SIZE = 768; // Jina embedding size

// Create collection if not exists
const initCollection = async () => {
  try {
    await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine"
      }
    });
    console.log("✅ Qdrant collection ready");
  } catch (err) {
    console.log("⚠️ Collection may already exist");
  }
};

// Add documents
const addDocuments = async (articles) => {
  const points = [];

  for (const article of articles) {
    const embedding = await generateEmbedding(
      `${article.title}. ${article.content}`
    );

    points.push({
      id: article.id,
      vector: embedding,
      payload: {
        title: article.title,
        content: article.content
      }
    });
  }

  await axios.put(
    `${QDRANT_URL}/collections/${COLLECTION_NAME}/points`,
    { points }
  );

  console.log(`✅ Stored ${points.length} articles in Qdrant`);
};

// Search documents
const searchDocuments = async (query) => {
  const embedding = await generateEmbedding(query);

  const response = await axios.post(
    `${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`,
    {
      vector: embedding,
      limit: 5
    }
  );

  return response.data.result;
};

module.exports = {
  initCollection,
  addDocuments,
  searchDocuments
};
