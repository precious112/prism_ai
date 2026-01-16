# Core Concepts

This section explains the fundamental concepts behind Prism AI's architecture.

## The Agentic Workflow

Unlike traditional chatbots that generate text token-by-token from a single prompt, Prism AI operates as a **System of Agents**. Each agent has a specific role, a set of tools, and a "brain" (LLM) to make decisions.

### 1. The Planner
The Planner is the architect. It doesn't do the research itself; it defines the *strategy*. By separating planning from execution, we prevent the model from getting "distracted" by early search results.

### 2. The Researcher (State Machine)
We model the researcher not as a linear chain, but as a **State Graph** (using LangGraph). This allows for cyclical behavior:
- **Gap Analysis**: The agent reads its own draft and asks, "Is this missing anything?"
- **Self-Correction**: If a search returns irrelevant results, the agent can refine its query and try again.

### 3. The Synthesizer
The Synthesizer (Conclusion Agent) acts as the editor-in-chief. It takes the raw drafts from multiple researchers and weaves them into a single narrative. It uses **Context-Aware Refinement** to ensure that Section B flows naturally from Section A, avoiding repetition.

## Why "Deep Research"?

Standard LLMs have a limited context window and "reasoning horizon". If you ask them to "write a comprehensive report on the future of batteries," they will likely give you a generic 500-word summary based on their training data.

Prism AI overcomes this by:
1.  **Decomposition**: Breaking the problem into 5-10 smaller sub-problems.
2.  **Parallelism**: Solving these sub-problems simultaneously.
3.  **Tool Use**: Accessing real-time data via Google Search and direct URL crawling.

This allows the system to generate reports that are 10x deeper and more factually accurate than a standard chat completion.
