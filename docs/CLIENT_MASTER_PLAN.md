# Prism AI Client Implementation Master Plan

This document serves as the **Source of Truth** for implementing the Next.js Client for Prism AI. It is designed to be fed into AI coding assistants to provide context, architectural constraints, and a specific task list.

## 1. System Overview

The Prism AI client is a **Next.js 14+ (App Router)** application that interfaces with the Backend API (Express) and WebSocket Server (Go). It aims to replicate the high-fidelity, real-time research experience of **Perplexity AI**.

### Core Architecture
-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS + `clsx`/`tailwind-merge`
-   **UI Library**: **Shadcn UI** (Radix Primitives + Tailwind)
-   **State Management**: `zustand` (Auth & Chat state)
-   **Network**: `axios` (REST API), `react-use-websocket` (Real-time updates)
-   **Rendering**: `react-markdown` + `rehype-raw` + Custom Components (for streaming XML reports)
-   **Animations**: `framer-motion`

### Key Design Principles
-   **Component-Driven**: Use Shadcn UI for a consistent, accessible design system.
-   **Real-Time First**: The UI must react immediately to WebSocket events (Status updates, Sources found).
-   **Visual Fidelity**: Focus on typography, spacing, and smooth animations (Perplexity-style).

## 2. API & WebSocket Integration

-   **API Base URL**: `http://localhost:3000/api`
-   **WebSocket URL**: `ws://localhost:8080/ws?userId=:userId`

### Critical Endpoints
-   **Login**: `POST /auth/login`
-   **Create Chat**: `POST /users/:userId/chats`
-   **List Chats**: `GET /users/:userId/chats`
-   **Send Message**: `POST /chats/:chatId/messages`
-   **Get Messages**: `GET /chats/:chatId/messages`

## 3. Implementation Task List

This list is sequential. **AI Instructions: Do ONE task at a time.**

> **CRITICAL INSTRUCTION**: After completing ANY task, you MUST update `docs/CLIENT_PROGRESS_LOG.md` with the details of what was changed and verified.

### Phase 1: Foundation & Setup

- [ ] **Task C-1: Project Scaffold & Dependencies**
    -   Initialize `client/` with `create-next-app` (TS, Tailwind, ESLint).
    -   Initialize **Shadcn UI** (`npx shadcn-ui@latest init`).
    -   Install core dependencies: `axios`, `zustand`, `react-use-websocket`, `react-markdown`, `lucide-react`, `framer-motion`, `@tailwindcss/typography`, `clsx`, `tailwind-merge`.
    -   Install Shadcn components: `button`, `input`, `card`, `scroll-area`, `sheet`, `avatar`, `dropdown-menu`.
    -   Setup `lib/utils.ts` (Shadcn default) and `lib/api.ts` (Axios instance with Interceptors).

- [ ] **Task C-2: Global State Management**
    -   Create `store/useAuthStore.ts`:
        -   State: `user`, `token`, `isAuthenticated`.
        -   Actions: `login(token, user)`, `logout()`.
        -   Persistence: Use `persist` middleware to save to localStorage.
    -   Create `store/useChatStore.ts`:
        -   State: `chats` (list), `activeChatId`, `messages` (for current chat).
        -   Actions: `setChats`, `addChat`, `setActiveChat`, `addMessage`.

### Phase 2: Public Interface & Auth

- [ ] **Task C-3: Landing Page (`/`)**
    -   Create `app/page.tsx` (The Landing Page).
    -   **Hero Section**: "Prism AI" title, subtitle, "Get Started" button (redirects to Login).
    -   **Features Grid**: 3 Cards highlighting "Deep Research", "Real-time Updates", "Citations".
    -   Use `framer-motion` for simple entrance animations.

- [ ] **Task C-4: Authentication Flow**
    -   Create `app/login/page.tsx`.
    -   UI: A centered Shadcn `Card` with `Form` (Email/Password).
    -   Logic: Call `POST /auth/login` -> `useAuthStore.login()` -> Redirect to `/chat`.
    -   Create `components/auth-guard.tsx`: A wrapper to protect private routes.

- [ ] **Task C-4.5: User Registration**
    -   Create `app/register/page.tsx`.
    -   UI: A centered Shadcn `Card` with `Form` (Name/Email/Password).
    -   Logic: Call `POST /api/users` (creates user + token).
    -   On Success: Call `useAuthStore.login()` with the returned token/user and redirect to `/chat`.
    -   Add "Don't have an account? Register" link to Login page.
    -   Add "Already have an account? Login" link to Register page.

### Phase 3: The Chat Application Shell

- [ ] **Task C-5: App Layout & Sidebar**
    -   Create `app/chat/layout.tsx`.
    -   **Sidebar**:
        -   Desktop: Fixed left column.
        -   Mobile: Shadcn `Sheet` (Drawer).
        -   Content: List of recent chats (fetched from `GET /users/:uid/chats`).
        -   "New Chat" Button: Calls `POST /users/:uid/chats` -> Redirects to `/chat/:newId`.
    -   **Main Area**: Render `children` (The Chat Interface).

- [ ] **Task C-6: Chat Interface Skeleton**
    -   Create `app/chat/[chatId]/page.tsx`.
    -   **Message List**: A scrollable area rendering user and assistant messages.
    -   **Input Area**: A floating bottom bar with Shadcn `Textarea` and "Send" button.
    -   **Logic**: Fetch history (`GET /chats/:id/messages`) on mount. Send message (`POST /chats/:id/messages`) on submit.

### Phase 4: The "Perplexity" Research UI

- [ ] **Task C-7: WebSocket Integration**
    -   Create `hooks/use-socket.ts`.
    -   Connect to `ws://localhost:8080/ws`.
    -   Handle connection status (Open/Closed/Error).
    -   Route incoming messages (`type: "agent_update"`) to the Chat Store or a local event handler.

- [ ] **Task C-8: Research Progress Components**
    -   Create `components/chat/status-indicator.tsx`:
        -   "Working..." pulse animation using `framer-motion`.
    -   Create `components/chat/progress-steps.tsx`:
        -   Render `plan_created` (ToC) as a checklist.
        -   Update active step based on `research_started`.
    -   Create `components/chat/search-queries.tsx`:
        -   Render pills for `tool_start` events (e.g., "Searching Google for...").

- [ ] **Task C-9: Source Cards Component**
    -   Create `components/chat/source-carousel.tsx`.
    -   Horizontal scroll container.
    -   Card Content: Favicon (use `https://www.google.com/s2/favicons?domain=...`), Title, Domain Name.
    -   Populate from `source_found` events.

### Phase 5: Report Rendering & Refinement

- [ ] **Task C-10: Streaming XML Report Renderer**
    -   Create `components/chat/report-renderer.tsx`.
    -   **Parser**: Implement logic to handle the XML stream (`<section>`, `<text>`, `<sources>`).
        -   *Hint*: Regex replacement or a simple stack-based parser.
    -   **Markdown**: Use `react-markdown` with `prose` (Tailwind Typography).
    -   **Citations**: Parse `<sources>` blocks and render them as inline badges or a "Sources" footer.

- [ ] **Task C-11: Final Polish**
    -   Integrate all components into the Chat View.
    -   Ensure auto-scrolling works as new tokens arrive.
    -   Polish typography and spacing to match the high-fidelity design.

### Phase 6: Enhancements

- [ ] **Task C-12: Model Selector (Grouped)**
    -   Update `client/lib/api.ts`: Modify `sendMessage` to accept an optional `model` string.
    -   Update `client/app/chat/[chatId]/page.tsx`:
        -   Import Shadcn `Select`, `SelectGroup`, `SelectLabel`, `SelectItem`.
        -   Implement a **Grouped Dropdown** organizing models by provider (OpenAI, Anthropic, Google, xAI).
        -   Config: Define a constant `AVAILABLE_MODELS` grouping them.
        -   Pass the selected model to `chatApi.sendMessage`.
    -   Persist selection: Remember the last used model in `localStorage` or `useChatStore`.
