const pool = require('../db');
const { generateEmbeddings } = require("../services/embeddingService");
const { initCollection, upsertVectors, getCollectionInfo } = require("../services/qdrantService");

const ingestNews = async (req, res) => {
  try {
    // Ensure Qdrant collection exists
    await initCollection();

    const BATCH_SIZE = 10;
    const pending = [];

    for (let i = 1; i <= 50; i++) {
      const title = `Sample News Title ${i}`;
      const content = `This is the content of news article number ${i}`;

      // 1️⃣ Store article in MySQL
      const [result] = await pool.query(
        'INSERT INTO articles (title, content) VALUES (?, ?)',
        [title, content]
      );

      const articleId = result.insertId;
      pending.push({ id: articleId, title, content });

      // When batch full or last item, process embeddings & upsert
      if (pending.length >= BATCH_SIZE || i === 50) {
        const embeddings = await generateEmbeddings(pending.map(p => p.content));

        const VECTOR_SIZE = 768;
        const points = pending.map((p, idx) => {
          const emb = embeddings[idx];
          if (!emb || emb.length !== VECTOR_SIZE) {
            throw new Error(`Embedding size mismatch for id ${p.id}: expected ${VECTOR_SIZE}, got ${emb ? emb.length : 'null'}`);
          }
          return {
            id: p.id,
            vector: emb,
            payload: { title: p.title, content: p.content }
          };
        });

        await upsertVectors(points);
        pending.length = 0; // clear batch
      }
    }

    // Fetch collection info to verify points_count
    try {
      const info = await getCollectionInfo();
      console.log('ℹ️ Qdrant collection info after ingestion:', info.result || info);
    } catch (e) {
      console.warn('Could not retrieve Qdrant collection info:', e.message || e);
    }

    res.status(200).json({
      message: "Successfully ingested 50 news articles"
    });

  } catch (err) {
    console.error("Ingest error:", err);
    res.status(500).json({ error: "Failed to ingest news" });
  }
};

module.exports = { ingestNews };
