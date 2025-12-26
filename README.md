# RAG News API 📰🧠

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-blue)](https://expressjs.com/)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Status: Assessment Submission](https://img.shields.io/badge/status-Assessment%20Submission-brightgreen)](#)
![Docker](https://img.shields.io/badge/docker--compose-ready-blue)



## Overview

RAG News API is a Node.js (Express) REST service that demonstrates a Retrieval-Augmented Generation (RAG) pipeline for answering user queries over a news corpus. It ingests news articles, generates embeddings, stores vectors in Qdrant, caches conversation state in Redis, and produces contextual answers via a pluggable LLM interface.

This project provides a production-oriented backend scaffold suitable for assessment or as a starter for a scalable news intelligence service. It emphasizes modular architecture, containerization, and clear testing steps for reviewers.

## Assessment Coverage (Edwid Tech)

This project was built specifically to satisfy the Backend Developer Assessment requirements.

| Requirement | Status |
|-----------|--------|
| RAG ingestion (~50 articles) | ✅ Implemented via `/ingest` |
| Embeddings (Jina / OSS) | ✅ Jina + fallback |
| Vector DB | ✅ Qdrant |
| LLM (Gemini) | ✅ Integrated + fallback |
| Redis session memory | ✅ Implemented |
| SQL structured logs | ✅ MySQL |
| REST APIs | ✅ All required endpoints |
| Docker Compose | ✅ Included |

---

## Features

### Core Functionality ⚙️
- ✅ POST `/ingest` — ingest ~50 news articles, store in MySQL, and upsert embeddings to Qdrant for retrieval.
- 🔎 Semantic Search — top‑k retrieval from Qdrant using Jina embeddings (fallback demo mode available).
- 💬 POST `/chat` — session-based chat that combines prior session context (Redis) and retrieved passages to produce answers.
- 📚 Persistent Logs — every interaction stored in MySQL for analytics and auditing.

### User Experience ✨
- 🧾 History endpoints: `GET /history/:sessionId` and `DELETE /history/:sessionId`.
- 🔁 Session caching in Redis for short-term memory / chat feel.
- 🧰 Docker Compose for repeatable local environment and demos.
- 🛡️ Graceful fallbacks when external services (Jina, Gemini, Qdrant) are unavailable.

### Content Sections
- Ingestion engine and scripts
- Embeddings pipeline and vector service
- Chat controller with RAG prompt composition
- Integration helpers (Gemini wrapper, Qdrant service)

---

## Tech Stack

### Frontend
- (None included) — this repo focuses on backend services; examples use `curl`/Postman.

### Backend & Services
- Node.js + Express — REST API and controllers.
- MySQL (`mysql2`) — structured persistence for `articles` and `logs`.
- Redis — session context caching (short-term memory).
- Qdrant — vector database for semantic search (dockerized in compose).
- Jina AI — embedding generation (uses `Jina` API; demo fallback available if key missing).
- Google GenAI (`@google/genai`) — optional LLM integration (Gemini models); template fallback used when unavailable.

### Development Tools
- Docker & Docker Compose — run full stack locally.
- dotenv — environment variable management.
- axios — HTTP client for external services.

---

## Installation

### Prerequisites
- Node.js v18+ and npm
- Docker & Docker Compose (recommended for full stack)
- MySQL or Docker with MySQL
- (Optional) `JINA_API_KEY` for embeddings and `GEMINI_API_KEY` for LLM access

### Step-by-step setup

1. Clone the repository

```bash
git clone https://github.com/SaYaN00101/rag-news-api.git
cd rag-news-api
```

2. Copy environment file and set variables

```bash
cp .env.example .env
# Edit .env and set MYSQL credentials, JINA_API_KEY, GEMINI_API_KEY etc.
```
```bash
# Database
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=changeme
MYSQL_DB=rag_news
PORT=3000

# Redis
REDIS_URL=redis://localhost:6379

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=news_vectors

# Jina (embeddings)
JINA_API_KEY=

# Google Gemini (GenAI)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```


3. Install dependencies

```bash
npm ci
```

> Note: If you later run `node app.js` manually and see an error like `Cannot find module 'swagger-ui-express'`, run `npm ci` (or `npm install`) to ensure all dependencies are installed. The server will still start without Swagger, but `/docs` will be unavailable until `swagger-ui-express` is installed. When running via Docker Compose with `docker compose up --build`, dependencies are installed in the image and `/docs` will be available.

4. Initialize DB tables

```bash
npm run init-db
```

5. Start the application (local)

```bash
node app.js
# Server runs on http://localhost:3000
```

6. Or start full stack via Docker Compose

```bash
docker compose up --build
```

---

## Usage

### 1) Ingest sample articles

```bash
curl -X POST http://localhost:3000/ingest -H "Content-Type: application/json"
```
- Verifies MySQL insert and upserts vectors to Qdrant.

### 2) Chat (RAG)

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo1","query":"Tell me about recent headlines"}'
```
- Response includes `response` and `sources` (titles of retrieved passages).

### 3) Session History

```bash
curl http://localhost:3000/history/demo1
curl -X DELETE http://localhost:3000/history/demo1
```

---

## Project Structure

```
rag-news-api/
├─ app.js                   # Express app + route wiring
├─ package.json
├─ Dockerfile
├─ docker-compose.yml
├─ scripts/
│  └─ init-db.js            # Initializes MySQL schema (articles, logs)
├─ src/
│  ├─ controllers/
│  │  ├─ ingestController.js
│  │  └─ chatController.js
│  ├─ services/
│  │  ├─ embeddingService.js
│  │  ├─ qdrantService.js
│  │  ├─ vectorService.js
│  │  └─ geminiService.js
│  ├─ routes/
│  │  ├─ ingestRoutes.js
│  │  ├─ chatRoutes.js
│  │  └─ historyRoutes.js
│  ├─ db.js                 # MySQL connection pool
│  └─ redisClient.js
└─ README.md
```

### File descriptions

| File | Description |
|------|-------------|
| `app.js` | Express app and route registration |
| `scripts/init-db.js` | Creates `articles` and `logs` tables |
| `src/controllers/ingestController.js` | Ingest articles, create embeddings, upsert to Qdrant |
| `src/controllers/chatController.js` | Chat endpoint (RAG flow + session logging) |
| `src/services/embeddingService.js` | Jina embedding wrapper (+ demo fallback) |
| `src/services/vectorService.js` | Qdrant collection management + search/upsert |
| `src/services/geminiService.js` | LLM wrapper (Gemini via `@google/genai`) and template fallback |
| `src/redisClient.js` | Configured Redis client with safe wrappers |

---

## Integration / External Services Setup

### Jina AI (Embeddings)
1. Create account at Jina.ai and get an API key.
2. Set `JINA_API_KEY` in `.env`.
3. The app will call Jina for embeddings during `/ingest`. If the key is not present, a deterministic demo fallback zero-vector is used.

### Qdrant (Vector DB)
1. Docker Compose includes Qdrant; it listens on `http://localhost:6333` by default.
2. Configure `QDRANT_URL` in `.env` to point to your Qdrant instance.

### Google Gemini (GenAI)
1. Obtain `GEMINI_API_KEY` from Google AI Studio and set it in `.env`.
2. Set `GEMINI_MODEL` in `.env` to pin a model (e.g., `gemini-2.5-flash`).

> **Note:** Gemini model availability depends on your API key, account, and region. The default model is configurable via `GEMINI_MODEL`. If the specified model is unavailable, the service automatically falls back to a deterministic template response to keep the API functional.

3. The code uses the `@google/genai` client; if the client is not installed or the specified model does not exist on your account, a template-based fallback ensures `/chat` still returns a helpful response for demos.

---

## Roadmap

**Short-term (1-2 months)**
- Implement streaming responses (SSE) for `/chat`.
- Postman collection available at `dev-tools/postman_collection.json`. Import into Postman or Thunder Client and set `baseUrl` to `http://localhost:3000`.
- Swagger UI available at `http://localhost:3000/docs` when server is running.
- Add more robust validation & standardized error middleware.

**Mid-term (3-6 months)**
- Add ingestion queue (BullMQ) for scalability and background processing.
- Add rate-limiting and authentication (API keys / JWT).
- Add unit and integration tests and CI pipelines.

**Long-term (6+ months)**
- Production deployment templates (Kubernetes, observability, autoscaling).
- Multi-tenant ingestion and per-tenant vector namespaces.

---

## Known Limitations

- Streaming responses are not enabled by default (planned via SSE).
- Ingestion is synchronous in demo mode; background queues are planned.
- Authentication and rate limiting are not enabled in this assessment version.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Open a pull request with a clear description and tests.
3. We welcome improvements, bug fixes, and documentation enhancements.

Contribution ideas:
- Add Swagger UI and Postman export.
- Implement streaming and client-sent events for chat.
- Add authentication and role-based permissions.

---

## License

This project is licensed under the **ISC License** — see `LICENSE` for details. You may use, modify, and distribute this code under the terms of the license.

---

## Acknowledgments

Thanks to the Jina, Qdrant, Google GenAI, Redis, and MySQL communities and libraries used in this project.

---

## Contact

- GitHub: [your-github-username](https://github.com/SaYaN00101)
- Email: sayanjagulia489@gmail.com
- LinkedIn: https://www.linkedin.com/in/sayan-jagulia

---

## Additional Tips

- Performance: batch embeddings during ingestion and upsert in chunks to reduce latency.
- Deployment: use `docker compose` for local testing and create a production Compose/K8s manifest for deployment.
- Customization: provide `GEMINI_MODEL` and `QDRANT_COLLECTION` env vars to configure behavior.
- Troubleshooting: check service logs (Qdrant, Redis, MySQL) and ensure env vars are set.
- Learning: read docs for Jina, Qdrant, and Google GenAI to tune prompts and embedding models.

---

**Last updated:** 2025-12-16

**Status:** WIP

**Created by:** Sayan Jagulia






