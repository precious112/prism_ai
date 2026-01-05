# API Backend Architecture

The API backend is a critical component of the Prism AI ecosystem. It's an Express.js application written in TypeScript that serves as the main gateway for the client. This document provides a deep dive into its architecture and structure.

## Technology Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Testing**: Jest & Supertest
- **Validation**: Zod

## Project Structure

The API backend follows a modular, feature-based (or "domain-based") architecture. Instead of grouping files by their type (e.g., a `controllers` folder, a `services` folder), we group them by feature. This makes the codebase much easier to navigate and scale.

Here's the structure of the `api/src` directory:

```
api/
└── src/
    ├── modules/
    │   ├── auth/           # Authentication (Login, Register, OAuth)
    │   ├── chat/           # Chat history and message management
    │   ├── research/       # Research task creation and status tracking
    │   ├── users/          # User profile management
    │   └── organizations/  # Team/Organization management
    │
    ├── middleware/
    │   ├── isAuthenticated.ts
    │   └── errorHandler.ts
    │
    ├── config/
    │   └── passport.ts
    │
    ├── utils/
    │   ├── logger.ts
    │   └── AppError.ts
    │
    ├── app.ts
    └── index.ts
```

### `modules`

This is the heart of the application. Each feature of the API resides in its own "module" folder.

- **`*.routes.ts`**: Defines the API endpoints for the feature (e.g., `POST /auth/login`) and maps them to controller functions.
- **`*.controller.ts`**: Handles the incoming HTTP request, validates the input (using the validation schemas), calls the appropriate service to perform the business logic, and sends the response.
- **`*.service.ts`**: Contains the core business logic for the feature. This is where the interaction with the database (via Prisma) happens.
- **`*.validation.ts`**: Defines validation schemas for incoming data using Zod. This ensures that the data reaching the controllers and services is in the expected shape.
- **`__tests__/`**: Contains all unit and integration tests for the feature, keeping the tests close to the code they are testing.

### `middleware`

This directory holds global Express middleware. For example, an `isAuthenticated.ts` middleware to protect routes, and an `errorHandler.ts` to catch and format errors.

### `config`

For application-wide configuration, primarily for managing environment variables and Passport strategies.

### `utils`

A place for shared utility functions and classes, such as a custom `AppError` class or a `logger`.

### `app.ts` & `index.ts`

- **`app.ts`**: Creates and configures the main Express app instance, registers global middleware, and mounts the feature routers from the `modules` directory.
- **`index.ts`**: The main entry point of the application. Its sole responsibility is to start the server.

## Logging

We use **Pino** for logging. It's a high-performance logging library for Node.js.

The logger is configured in `src/utils/logger.ts` and is environment-aware:
- **In Development**: It uses `pino-pretty` to print human-readable logs to the console.
- **In Production**: It will be configured to write structured JSON logs to a file or a logging service.

The log level is configurable via the `LOG_LEVEL` environment variable.
