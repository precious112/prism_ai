import unittest
import sys
import os
from unittest.mock import MagicMock, patch

# Add src to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agents.planning_agent import PlanningAgent, ResearchPlan, Section

class TestPlanningAgent(unittest.TestCase):
    def test_generate_plan(self):
        # Mock the model
        mock_model = MagicMock()
        mock_structured_llm = MagicMock()
        
        mock_model.with_structured_output.return_value = mock_structured_llm
        
        agent = PlanningAgent(mock_model)
        
        mock_chain = MagicMock()
        # Setup the chain to return our desired plan
        mock_chain.invoke.return_value = ResearchPlan(sections=[
            Section(title="Introduction", description="Intro"),
            Section(title="Conclusion", description="Outro")
        ])
        
        # Patch ChatPromptTemplate so we can control the pipe result
        with patch('src.agents.planning_agent.ChatPromptTemplate') as MockPrompt:
            # MockPrompt.from_messages returns a mock_prompt instance
            mock_prompt_instance = MagicMock()
            MockPrompt.from_messages.return_value = mock_prompt_instance
            
            # mock_prompt_instance | structured_llm -> mock_chain
            # We configure the return value of the OR operation on the prompt mock
            mock_prompt_instance.__or__.return_value = mock_chain
            
            plan = agent.generate_plan("Test Query")
            
            self.assertEqual(len(plan.sections), 2)
            self.assertEqual(plan.sections[0].title, "Introduction")
            self.assertEqual(plan.sections[1].title, "Conclusion")
            
            # Verify invoke was called with correct query
            mock_chain.invoke.assert_called_with({"query": "Test Query"})

if __name__ == '__main__':
    unittest.main()
