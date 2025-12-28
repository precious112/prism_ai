import unittest
import sys
import os
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch
from langchain_core.messages import AIMessage

# Ensure core/src is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agents.researcher_agent import ResearcherAgent, GapAnalysis, Action

class TestResearcherAgent(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.mock_model = MagicMock()
        # Mock structured output chain
        self.mock_gap_chain = MagicMock()
        self.mock_gap_chain.ainvoke = AsyncMock() # Use AsyncMock for ainvoke
        self.mock_model.with_structured_output.return_value = self.mock_gap_chain
        
        self.agent = ResearcherAgent(self.mock_model, serper_api_key="fake")
        # Replace tools with mock
        self.agent.serper_tool = MagicMock()
        self.agent.crawler_tool = MagicMock()

    async def test_check_gaps_initial(self):
        state = {
            "topic": "Test Topic",
            "description": "Test Desc",
            "draft": "",
            "revision_number": 0,
            "max_revisions": 3
        }
        result = await self.agent.check_gaps(state)
        self.assertEqual(result["revision_number"], 1)
        self.assertTrue(len(result["pending_actions"]) > 0)
        self.assertEqual(result["pending_actions"][0]["tool"], "search")

    @patch('src.agents.researcher_agent.ChatPromptTemplate')
    async def test_check_gaps_complete(self, mock_prompt_cls):
        # Setup mock chain behavior
        mock_chain = MagicMock()
        mock_analysis = GapAnalysis(is_complete=True, missing_info="", actions=[])
        mock_chain.ainvoke = AsyncMock(return_value=mock_analysis)

        # Setup mock prompt behavior
        mock_prompt = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_prompt_cls.from_messages.return_value = mock_prompt

        state = {
            "topic": "Test Topic",
            "description": "Test Desc",
            "draft": "Existing draft",
            "revision_number": 1
        }
        
        result = await self.agent.check_gaps(state)
        self.assertEqual(len(result["pending_actions"]), 0)

    @patch('src.agents.researcher_agent.ChatPromptTemplate')
    async def test_check_gaps_incomplete(self, mock_prompt_cls):
        # Setup mock chain behavior
        mock_chain = MagicMock()
        action = Action(tool="search", query_or_url="query1")
        mock_analysis = GapAnalysis(is_complete=False, missing_info="Need more info", actions=[action])
        mock_chain.ainvoke = AsyncMock(return_value=mock_analysis)

        # Setup mock prompt behavior
        mock_prompt = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_prompt_cls.from_messages.return_value = mock_prompt

        state = {
            "topic": "Test Topic",
            "description": "Test Desc",
            "draft": "Incomplete draft",
            "revision_number": 1
        }
        
        result = await self.agent.check_gaps(state)
        self.assertEqual(result["revision_number"], 2)
        self.assertEqual(result["pending_actions"][0]["tool"], "search")
        self.assertEqual(result["pending_actions"][0]["query_or_url"], "query1")

    async def test_search_node(self):
        state = {"pending_actions": [{"tool": "search", "query_or_url": "q1"}]}
        self.agent.serper_tool.search.return_value = [{"title": "R1", "url": "u1", "content": "c1"}]
        
        # search_node uses loop.run_in_executor
        result = await self.agent.search_node(state)
        self.assertEqual(len(result["search_results"]), 1)
        self.agent.serper_tool.search.assert_called_with("q1", 3)

    async def test_crawl_node(self):
        state = {"pending_actions": [{"tool": "crawl", "query_or_url": "http://test.com"}]}
        self.agent.crawler_tool.crawl.return_value = "Crawled Content"
        
        result = await self.agent.search_node(state)
        self.assertEqual(len(result["search_results"]), 1)
        self.assertEqual(result["search_results"][0]["content"], "Crawled Content")
        self.agent.crawler_tool.crawl.assert_called_with("http://test.com")

    @patch('src.agents.researcher_agent.ChatPromptTemplate')
    async def test_synthesize_node(self, mock_prompt_cls):
        # Setup the chain mock
        mock_chain = MagicMock()
        mock_chain.ainvoke = AsyncMock(return_value=AIMessage(content="Updated Draft"))
        
        # When prompt | model is called
        mock_prompt = MagicMock()
        # Mock the pipe operator behavior
        mock_prompt.__or__.return_value = mock_chain
        mock_prompt_cls.from_messages.return_value = mock_prompt
        
        state = {
            "topic": "T",
            "description": "D",
            "draft": "Old",
            "search_results": [{"title": "R1", "url": "u1", "content": "c1"}]
        }
        
        result = await self.agent.synthesize_node(state)
        self.assertEqual(result["draft"], "Updated Draft")

if __name__ == '__main__':
    unittest.main()
