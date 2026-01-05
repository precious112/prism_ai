# Installation & Setup

This guide will help you set up Prism AI locally using Docker Compose.

## Prerequisites

*   **Docker Desktop** (or Docker Engine + Docker Compose)
*   **Git**
*   **Node.js** (Optional, for local debugging without Docker)
*   **Python 3.11+** (Optional, for local debugging without Docker)
*   **Go 1.22+** (Optional, for local debugging without Docker)

## Quick Start (Docker)

The easiest way to run Prism AI is with Docker Compose. This will spin up the database, Redis, API, Worker, WebSocket server, and Client.

### 1. Clone the Repository

```bash
git clone https://github.com/precious112/prism_ai.git
cd prism_ai
```

### 2. Configure Environment Variables

The project uses multiple environment files for different services. You need to verify (and potentially modify) the following files:

*   **`core/docker.env`**: Configuration for the Python AI Worker.
    *   `OPENAI_API_KEY`: Required for LLM usage.
    *   `SERPER_API_KEY`: Required for Google Search.
    *   `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`: Optional alternatives.
*   **`api/docker.env`**: Configuration for the Express API.
    *   `DATABASE_URL`, `REDIS_URL`: Pre-configured for Docker.
    *   `OFFLINE_MODE`: Set to `true` to disable complex auth for development.
*   **`client/.env`**: Configuration for the Next.js Client.
    *   `NEXT_PUBLIC_API_URL`: Should point to `http://localhost:3001/api`.
    *   `NEXT_PUBLIC_WS_URL`: Should point to `ws://localhost:8080/ws`.

**Important**: You must add your API keys (OpenAI, Serper) to `core/docker.env` before starting.

### 3. Build and Start Services

Run the following command in the root directory:

```bash
docker-compose up --build
```

This may take a few minutes as it builds the Docker images for the client, api, worker, and websocket server.

### 4. Access the Application

Once everything is running, open your browser:

*   **Client**: [http://localhost:3000](http://localhost:3000)
*   **API**: [http://localhost:3001/api](http://localhost:3001/api)
*   **Prisma Studio** (Database GUI): You can run `npx prisma studio` in the `api/` folder if you have Node installed locally.

## Troubleshooting

### "Database connection failed"
If the API fails to connect to Postgres initially, it might be because the database container is still initializing. Docker Compose is configured with health checks, so it should retry automatically. If it persists, try restarting the API container:
```bash
docker-compose restart api
```

### "WebSocket connection failed"
Ensure port `8080` is not blocked by a firewall or another application. The client tries to connect to `ws://localhost:8080/ws`.

### "Search failed" or "LLM Error"
Check the logs of the `worker` container to see the Python error trace. Usually, this means an API key is missing or invalid in `core/docker.env`.
```bash
docker-compose logs -f worker
```
