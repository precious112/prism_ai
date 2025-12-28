# AI Workers Architecture

The AI Worker service (`core/`) is the intelligence engine of Prism AI. It is a standalone Python application designed to execute complex, multi-step research tasks asynchronously.

## 1. Overview

The worker operates on a **"Plan-and-Execute"** architecture using **LangGraph**. It breaks down a user query into manageable sections, researches them in parallel, and streams a synthesized final report back to the client.

### Key Technologies
*   **Runtime**: Python 3.11+
*   **Framework**: LangGraph (LangChain)
*   **Orchestration**: Redis (Message Broker)
*   **Search Tools**: Google Serper (Search), Custom Crawler (Direct URL)

## 2. The Agent Workflow

The research process is composed of several specialized agents:

### A. Planning Agent
*   **Role**: Architect.
*   **Input**: User Query.
*   **Logic**: Uses an LLM (configurable: OpenAI, Anthropic, Google, xAI) to generate a structured **Table of Contents (ToC)**.
*   **Output**: A list of sections to research.

### B. Researcher Agent (The Graph)
*   **Role**: Specialist.
*   **Execution**: One instance is spawned *per section* of the ToC (Parallel Execution).
*   **Logic (Loop)**:
    1.  **Check Gaps**: Analyzes the current draft. Decides if more info is needed.
    2.  **Tool Selection**: Chooses between **Search** (broad queries) or **Crawl** (deep dive into specific URLs).
    3.  **Synthesize**: Updates the section draft with new findings.
*   **Output**: A comprehensive draft for that specific section, including source citations.

### C. Conclusion Agent
*   **Role**: Editor & Publisher.
*   **Logic**:
    *   **Context-Aware Refinement**: Iterates through the completed drafts.
    *   **Deduplication**: Feeds the accumulated report context back into the LLM to ensure the next section flows naturally and removes repetitive information.
    *   **Streaming**: Yields the refined content token-by-token.

## 3. Communication Protocol

The Worker communicates with the rest of the system via **Redis**.

### Input: `research_tasks`
The API publishes tasks to this Redis list.
```json
{
  "requestId": "uuid",
  "userId": "uuid",
  "chatId": "uuid",
  "query": "Research Quantum Physics",
  "config": { "model": "gpt-4-turbo", "provider": "openai" }
}
```

### Output: `updates`
The Worker publishes real-time events to this Redis channel, which the WebSocket server forwards to the client.

#### Event Types
*   **`plan_created`**: The ToC is ready.
*   **`research_started`**: A researcher has started working on a section.
*   **`tool_start`**: An agent is using Google Search or Crawling a URL.
*   **`source_found`**: A relevant source was discovered.
*   **`report_chunk`**: A piece of the final report (Streamed).
*   **`completed`**: The process is finished.

## 4. Final Report Format

The final report is streamed and saved as **XML-structured Markdown**. This allows the frontend to render text and citations distinctly.

```xml
<section title="Executive Summary">
  <text>
    Quantum physics is the study of matter and energy...
  </text>
</section>

<section title="1. Historical Context">
  <text>
    The field began with Max Planck's discovery...
  </text>
  <sources>
    <link url="https://wikipedia.org/wiki/Max_Planck" title="Max Planck - Wikipedia" />
    <link url="https://britannica.com/..." title="Quantum Mechanics" />
  </sources>
</section>
```

## 5. Development

The worker source code is located in `core/`.
*   **Entry Point**: `core/src/worker.py`
*   **Agents**: `core/src/agents/`
*   **Tools**: `core/src/tools/`

To run locally:
```bash
cd core
uv run src/worker.py
```
