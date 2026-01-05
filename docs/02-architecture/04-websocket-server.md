# WebSocket Server Architecture

The WebSocket Server is a high-performance, real-time communication relay written in **Go**. Its primary responsibility is to maintain persistent connections with clients and forward updates from the AI Workers.

## Technology Stack

*   **Language**: Go (Golang) 1.22+
*   **WebSocket Library**: `github.com/gorilla/websocket`
*   **Redis Client**: `github.com/redis/go-redis/v9`
*   **Concurrency**: Goroutines & Channels

## Architecture

The server follows the **Hub** pattern to manage client connections and broadcasting.

### 1. The Hub (`internal/websocket/hub.go`)
The `Hub` is the central component that:
*   Maintains a registry of connected clients (`clients` map).
*   Maps User IDs to their active connections (`userClients` map).
*   Subscribes to the Redis `updates` channel.
*   Broadcasts messages to specific users or all connected clients.

### 2. The Client (`internal/websocket/client.go`)
Each connected user is represented by a `Client` struct.
*   **`readPump`**: A goroutine that pumps messages from the WebSocket connection to the Hub.
*   **`writePump`**: A goroutine that pumps messages from the Hub to the WebSocket connection.
*   Handles ping/pong heartbeats to keep connections alive.

### 3. Redis Broker (`internal/broker/redis.go`)
The server acts as a subscriber in the Pub/Sub model.
*   **Channel**: `updates`
*   **Message Format**:
    ```json
    {
      "target_user_id": "uuid",
      "type": "agent_update",
      "payload": { ... }
    }
    ```

## Message Flow

1.  **AI Worker** publishes a progress update (e.g., "Searching Google...") to the Redis `updates` channel.
2.  **WebSocket Server** receives this message via its Redis subscription.
3.  **Hub** checks the `target_user_id` in the message.
4.  **Hub** looks up the active WebSocket connection(s) for that user.
5.  **Hub** pushes the message payload down the `send` channel of the target client(s).
6.  **Client's `writePump`** picks up the message and writes it to the WebSocket TCP connection.
7.  **Next.js Client** receives the event and updates the UI.
