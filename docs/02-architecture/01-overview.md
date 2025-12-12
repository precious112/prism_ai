# Prism AI - Architecture Overview

## 1. Project Overview

Prism AI is an open-source AI research agent designed to be an alternative to services like Perplexity AI's research feature. It is composed of a web-based client, a backend API, a real-time communication server, and a set of Python-based AI workers. The entire project is housed in a monorepo to facilitate open-source collaboration.

The primary goals of this project are to showcase senior-level software engineering skills in TypeScript, Python, and Go, and to create a high-quality, "world-class" open-source application.

## 2. High-Level Architecture

Prism AI is built on a microservices-oriented architecture. This design promotes scalability, resilience, and a clear separation of concerns, allowing each component to be developed, deployed, and scaled independently.

The core of the architecture is a set of decoupled services that communicate asynchronously via a message broker.

```
+----------------+      +-------------------+      +---------------------+
|                |      |                   |      |                     |
| Next.js Client |----->|    API Backend    |----->|    Message Broker   |
|                |<-----|  (Express.js)     |<-----|  (e.g., RabbitMQ)   |
+----------------+      +-------------------+      +----------+----------+
       ^                                                      |
       | WebSocket                                            |
       |                                                      v
+----------------+      +-------------------+      +---------------------+
|                |      |                   |      |                     |
| WebSocket      |<-----|  AI Workers       |<-----|                     |
| Server (Go)    |      |  (Python/Celery)  |      |                     |
+----------------+      +-------------------+      +---------------------+
```

## 3. Component Breakdown

The project is divided into four main services:

*   **`client/` (Next.js)**: The user-facing application built with Next.js and TypeScript. It handles all user interactions, sends requests to the API backend, and receives real-time updates from the WebSocket server.

*   **`api/` (Express.js)**: The central API for the application, built with Express.js and TypeScript. Its responsibilities include:
    *   Handling user authentication and authorization (in "online" mode).
    *   Providing a REST API for the client.
    *   Receiving research requests and dispatching them as tasks to the message broker.
    *   Persisting results to a PostgreSQL database using Prisma as the ORM.

*   **`core/` (Python AI Workers)**: A set of Python-based workers responsible for the core AI and research functionality. These workers:
    *   Listen for tasks on the message broker.
    *   Execute complex, long-running research tasks.
    *   Publish progress updates and final results back to the message broker.
    *   Will likely use a framework like Celery for task management.

*   **`websocket/` (Go)**: A high-performance WebSocket server written in Go. Its sole purpose is to provide a real-time communication channel between the backend and the client. It listens for progress updates from the AI workers via the message broker and pushes them to the connected clients.

## 4. Technology Stack

*   **Frontend**: Next.js, React, TypeScript
*   **API Backend**: Express.js, TypeScript, Node.js
*   **AI Workers**: Python (potentially with Celery)
*   **WebSocket Server**: Go
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Message Broker**: RabbitMQ or Redis (to be decided)
*   **Containerization**: Docker

## 5. Local/Offline Mode

To facilitate ease of development and contribution, the project supports a local "offline" mode, managed via Docker Compose. This is controlled by an `APP_MODE` environment variable.

*   **`APP_MODE=online`**: The configuration for the live, deployed version. It includes features like user authentication.
*   **`APP_MODE=offline`**: The configuration for local development. In this mode, authentication is disabled, and the entire application stack (including the database and message broker) can be run locally with a single `docker-compose up` command.

This approach significantly lowers the barrier to entry for new developers and allows for easy testing and development.
