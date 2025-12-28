from typing import List, TypedDict, Annotated, Dict, Any, Literal
import operator
import json
import asyncio
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field

from src.tools.serper_tool import SerperTool
from src.tools.crawler_tool import CrawlerTool

class Action(BaseModel):
    tool: Literal["search", "crawl"] = Field(description="The tool to use: 'search' for Google, 'crawl' for visiting a specific URL")
    query_or_url: str = Field(description="The search query or the URL to crawl")

class ResearcherState(TypedDict):
    topic: str
    description: str
    draft: str
    search_results: Annotated[List[Dict], operator.add]
    revision_number: int
    max_revisions: int
    pending_actions: List[Dict]

class GapAnalysis(BaseModel):
    is_complete: bool = Field(description="Whether the section draft completely covers the topic and description")
    missing_info: str = Field(description="What specific information is missing, if any")
    actions: List[Action] = Field(description="List of actions (search or crawl) to find missing info")

class ResearcherAgent:
    def __init__(self, model: BaseChatModel, serper_api_key: str = None, event_callback=None):
        self.model = model
        self.serper_tool = SerperTool(api_key=serper_api_key)
        self.crawler_tool = CrawlerTool()
        self.gap_analyzer = model.with_structured_output(GapAnalysis)
        self.event_callback = event_callback
        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(ResearcherState)

        workflow.add_node("check_gaps", self.check_gaps)
        workflow.add_node("search_node", self.search_node)
        workflow.add_node("synthesize_node", self.synthesize_node)

        workflow.set_entry_point("check_gaps")

        workflow.add_conditional_edges(
            "check_gaps",
            self.should_continue,
            {
                "continue": "search_node",
                "end": END
            }
        )

        workflow.add_edge("search_node", "synthesize_node")
        workflow.add_edge("synthesize_node", "check_gaps")

        return workflow.compile()

    async def check_gaps(self, state: ResearcherState):
        draft = state.get("draft", "")
        topic = state["topic"]
        description = state["description"]
        revision = state.get("revision_number", 0)
        max_rev = state.get("max_revisions", 3)

        # Force finish if max revisions reached
        if revision >= max_rev:
            return {"pending_actions": []}

        # Initial pass (no draft)
        if not draft:
            if self.event_callback:
                self.event_callback("gap_detected", {"reason": "Starting initial research"})
            return {
                "revision_number": revision + 1,
                "pending_actions": [{"tool": "search", "query_or_url": f"{topic} {description}"[:100]}]
            }

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a research supervisor. Analyze the current draft. If you need more info, decide whether to SEARCH Google or CRAWL a specific URL (if you found one previously)."),
            ("user", "Topic: {topic}\nDescription: {description}\n\nCurrent Draft:\n{draft}\n\nIs this complete? If not, what actions should we take?")
        ])
        
        chain = prompt | self.gap_analyzer
        analysis = await chain.ainvoke({"topic": topic, "description": description, "draft": draft})
        
        if analysis.is_complete:
            return {"pending_actions": []}
        else:
            if self.event_callback:
                self.event_callback("gap_detected", {"reason": analysis.missing_info})
            
            # Convert Pydantic actions to dict
            actions = [a.model_dump() for a in analysis.actions]
            return {
                "revision_number": revision + 1,
                "pending_actions": actions
            }

    def should_continue(self, state: ResearcherState):
        actions = state.get("pending_actions", [])
        if actions:
            return "continue"
        return "end"

    async def search_node(self, state: ResearcherState):
        actions = state.get("pending_actions", [])
        results = []
        loop = asyncio.get_running_loop()

        for action in actions:
            tool = action["tool"]
            target = action["query_or_url"]

            if self.event_callback:
                self.event_callback("tool_start", {
                    "tool": tool,
                    "query": target
                })

            if tool == "search":
                items = await loop.run_in_executor(None, self.serper_tool.search, target, 3)
                results.extend(items)
                if self.event_callback:
                    for item in items:
                        self.event_callback("source_found", {"title": item.get("title"), "url": item.get("url")})
            
            elif tool == "crawl":
                content = await loop.run_in_executor(None, self.crawler_tool.crawl, target)
                results.append({"title": f"Crawl: {target}", "url": target, "content": content})
                if self.event_callback:
                    self.event_callback("source_found", {"title": f"Crawl: {target}", "url": target})
        
        return {"search_results": results}

    async def synthesize_node(self, state: ResearcherState):
        topic = state["topic"]
        description = state["description"]
        draft = state.get("draft", "")
        results = state.get("search_results", [])
        
        # Format context (simple concatenation)
        context = ""
        for i, res in enumerate(results):
             context += f"Source {i+1}: {res['title']}\nURL: {res['url']}\nContent: {res['content']}\n\n"

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a research writer. Incorporate the new information into the draft. Ensure the draft covers the topic and description comprehensively."),
            ("user", "Topic: {topic}\nDescription: {description}\n\nExisting Draft:\n{draft}\n\nNew Research Materials:\n{context}\n\nWrite the updated draft (Markdown):")
        ])
        
        chain = prompt | self.model
        response = await chain.ainvoke({
            "topic": topic, 
            "description": description, 
            "draft": draft, 
            "context": context
        })
        
        return {"draft": response.content}

    async def run_research(self, topic: str, description: str) -> Dict[str, Any]:
        initial_state = {
            "topic": topic,
            "description": description,
            "draft": "",
            "search_results": [],
            "revision_number": 0,
            "max_revisions": 3,
            "pending_actions": []
        }
        
        final_state = await self.graph.ainvoke(initial_state)
        return {
            "content": final_state["draft"],
            "sources": final_state.get("search_results", [])
        }
