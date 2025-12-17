// qdrantService: lightweight wrapper around Qdrant's JS client.
// - Resilient init (create collection if missing)
// - Safe upsert/search helpers that log and fail gracefully where appropriate
const { QdrantClient } = require('@qdrant/js-client-rest');

const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
const client = new QdrantClient({ url: qdrantUrl, checkCompatibility: false });

const COLLECTION = 'news_vectors';

async function initCollection() {
  try {
    await client.getCollection(COLLECTION);
    console.log(`✅ Qdrant collection "${COLLECTION}" exists`);
  } catch (err) {
    try {
      await client.createCollection(COLLECTION, {
        vectors: {
          size: 768,
          distance: 'Cosine'
        }
      });
      console.log(`✅ Qdrant collection "${COLLECTION}" created`);
    } catch (e) {
      console.error('Qdrant createCollection failed (will continue without collection):', e.message || e);
    }
  }
}

async function upsertVectors(points) {
  try {
    const res = await client.upsert(COLLECTION, { points });
    console.log(`✅ Upserted ${points.length} points to collection "${COLLECTION}"`);
    return res;
  } catch (err) {
    console.error('Failed to upsert vectors:', err.message || err);
    throw err;
  }
}

async function upsertVector(id, vector, payload) {
  return upsertVectors([{ id, vector, payload }]);
}

async function searchVectors(vector, limit = 3) {
  try {
    return await client.search(COLLECTION, { vector, limit });
  } catch (err) {
    console.warn('Qdrant search failed, returning no results:', err.message || err);
    return [];
  }
}

async function getCollectionInfo() {
  try {
    return await client.getCollection(COLLECTION);
  } catch (err) {
    console.warn('Failed to get collection info:', err.message || err);
    return null;
  }
}

module.exports = {
  initCollection,
  upsertVector,
  upsertVectors,
  searchVectors,
  getCollectionInfo,
  client
};
