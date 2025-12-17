const { GoogleGenAI } = require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

function generateTemplateAnswer(context, query) {
  // Template fallback used for demos and when no external LLM is available.
  // It summarizes up to the first three non-empty lines of the retrieved context.
  const contextLines = context.split('\n').filter(l => l.trim().length > 0).slice(0, 3);
  const citedContext = contextLines.length > 0 ? contextLines.join('; ') : 'No context provided.';
  
  return `Based on the provided context: ${citedContext}\n\nAnswering your question "${query}": The information above is relevant to your query. Please refer to the news articles for detailed information.`;
}

async function generateAnswer(context, query) {
  if (!ai) {
    console.log('[Demo Mode] Using template-based response (no API key available)');
    return generateTemplateAnswer(context, query);
  }

  const prompt = `You are a news assistant.\n\nContext:\n${context}\n\nQuestion:\n${query}\n\nAnswer clearly based ONLY on the context above.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    
    if (response && response.text) {
      return response.text;
    }
    return JSON.stringify(response);
  } catch (err) {
    console.error('Gemini API error:', err.message || err);
    console.log('[Fallback] Using template-based response');
    return generateTemplateAnswer(context, query);
  }
}

module.exports = { generateAnswer };
