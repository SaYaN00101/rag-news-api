// chatController: handles chat interactions using RAG (searchDocuments) + LLM (generateAnswer).
// - POST /chat (chatHandler): requires { sessionId, query } — returns { response, sources }
// - GET /history/:sessionId (getHistory): returns stored interactions
// - DELETE /history/:sessionId (deleteHistory): clears session logs and Redis context
const pool = require('../db');
const redisClient = require('../redisClient');
const { generateAnswer } = require('../services/geminiService');
const { searchDocuments } = require('../services/vectorService');

const chatHandler = async (req, res) => {
  try {
    const { sessionId, query } = req.body;

    if (!sessionId || !query) {
      return res.status(400).json({ error: "sessionId and query are required" });
    }

    // Retrieve previous context from Redis
    let context = await redisClient.get(sessionId);
    context = context ? JSON.parse(context) : [];

    // Build context text from prior interactions
    const contextText = (Array.isArray(context) ? context : [])
      .map(c => `Q: ${c.query}\nA: ${c.response}`)
      .join('\n');

    // Retrieve top-k relevant passages from vector DB (RAG)
    let retrieved = [];
    try {
      retrieved = await searchDocuments(query); // returns array of hits with payload
    } catch (err) {
      console.warn('Vector search failed, continuing without retrieved context:', err.message || err);
      retrieved = [];
    }

    const retrievedContext = (Array.isArray(retrieved) ? retrieved : [])
      .map(r => r.payload?.content || r.payload?.text || '')
      .filter(Boolean)
      .join('\n');

    // Call Gemini-based LLM with RAG context
    const startTime = Date.now();
    const llm_response = await generateAnswer(`${retrievedContext}\n\n${contextText}`, query);
    const responseTime = Date.now() - startTime;

    // Save this interaction to MySQL
    await pool.query(
      'INSERT INTO logs (session_id, user_query, llm_response, response_time) VALUES (?, ?, ?, ?)',
      [sessionId, query, llm_response, responseTime]
    );

    // Update Redis context
    context.push({ query, response: llm_response });
    await redisClient.set(sessionId, JSON.stringify(context));

    res.status(200).json({
      response: llm_response,
      sources: retrieved.map(r => r.payload?.title).filter(Boolean)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chat failed" });
  }
};

// Fetch session history
const getHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    // Return timestamp field (matches assessment spec) along with query/response
    const [rows] = await pool.query('SELECT user_query, llm_response, `timestamp` FROM logs WHERE session_id = ?', [sessionId]);
    res.status(200).json({ sessionId, history: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// Delete session
const deleteHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await pool.query('DELETE FROM logs WHERE session_id = ?', [sessionId]);
    // redisClient exposes rawClient for direct operations
    if (redisClient.rawClient && typeof redisClient.rawClient.del === 'function') {
      await redisClient.rawClient.del(sessionId);
    }
    res.status(200).json({ message: `Session ${sessionId} cleared` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete session" });
  }
};

module.exports = { chatHandler, getHistory, deleteHistory };

