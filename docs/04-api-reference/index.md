# API Reference

This document outlines the core REST API endpoints provided by the Prism AI backend.

**Base URL**: `http://localhost:3001/api`

## Authentication (`/auth`)

### Login
Authenticates a user and returns access/refresh tokens.
*   **POST** `/auth/login`
*   **Body**: `{ "email": "user@example.com", "password": "password" }`
*   **Response**: `{ "accessToken": "...", "refreshToken": "...", "user": { ... } }`

### Offline Login
Simplified login for local development (when `OFFLINE_MODE=true`).
*   **POST** `/auth/offline-login`
*   **Body**: `{ "email": "dev@local.com" }` (No password required)

### Refresh Token
Obtain a new access token using a valid refresh token.
*   **POST** `/auth/refresh`
*   **Body**: `{ "refreshToken": "..." }`

### OAuth
*   **GET** `/auth/google` - Initiate Google Login
*   **GET** `/auth/github` - Initiate GitHub Login

## Users (`/users`)

### Register
Create a new user account.
*   **POST** `/users`
*   **Body**: `{ "email": "...", "password": "...", "name": "..." }`

### Get User Profile
*   **GET** `/users/:id`
*   **Headers**: `Authorization: Bearer <token>`

### List User Chats
Retrieve all chats belonging to a user.
*   **GET** `/users/:id/chats`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response**: `[{ "id": "...", "title": "...", "createdAt": "..." }, ...]`

### Create Chat
Initialize a new research session.
*   **POST** `/users/:id/chats`
*   **Headers**: `Authorization: Bearer <token>`
*   **Body**: `{ "title": "Optional Title", "model": "gpt-4o" }`

## Chats (`/chats`)

### Get Chat History
Retrieve messages for a specific chat.
*   **GET** `/chats/:id/messages`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response**: `[{ "id": "...", "role": "user|assistant", "content": "..." }, ...]`

### Send Message
Send a message to the agent to start/continue research.
*   **POST** `/chats/:id/messages`
*   **Headers**: `Authorization: Bearer <token>`
*   **Body**: `{ "content": "Research quantum physics", "model": "gpt-4o" }`
*   **Note**: This triggers a background task. Updates are sent via WebSocket.

### Delete Chat
*   **DELETE** `/chats/:id`
*   **Headers**: `Authorization: Bearer <token>`

## Error Handling

The API returns standard HTTP status codes:
*   `200/201`: Success
*   `400`: Bad Request (Validation Error)
*   `401`: Unauthorized (Invalid Token)
*   `403`: Forbidden (Insufficient Permissions)
*   `404`: Not Found
*   `500`: Internal Server Error

Error Body Format:
```json
{
  "status": "error",
  "message": "Error description"
}
```
