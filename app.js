// 1. Import packages first
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { initCollection } = require("./src/services/qdrantService");

// 2. Initialize the Express app
const app = express();

// 3. Middleware
app.use(cors());
app.use(express.json());

// 4. Import routes AFTER initializing app
const ingestRoutes = require('./src/routes/ingestRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const historyRoutes = require('./src/routes/historyRoutes');

// 5. Use routes
app.use('/ingest', ingestRoutes);
app.use('/chat', chatRoutes);
app.use('/history', historyRoutes);

// 6. Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Swagger UI for API docs (optional dependency)
// If `swagger-ui-express` is not installed, the server will still start but /docs will be disabled.
try {
  const swaggerUi = require('swagger-ui-express');
  const openapiDocument = require('./openapi.json');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
} catch (e) {
  console.warn('⚠️ Swagger UI not available. Install "swagger-ui-express" to enable /docs:', e.message || e);
}

// 🔥 7. Initialize Qdrant collection
initCollection();

// 8. Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
