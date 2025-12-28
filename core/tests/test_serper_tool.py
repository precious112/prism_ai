import unittest
import sys
import os
from unittest.mock import patch, MagicMock

# Ensure core/src is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.tools.serper_tool import SerperTool

class TestSerperTool(unittest.TestCase):

    def test_search_success(self):
        tool = SerperTool(api_key="test-key")
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "organic": [
                {"title": "Test Title", "link": "http://test.com", "snippet": "Test snippet"}
            ]
        }
        mock_response.raise_for_status = MagicMock()

        with patch('requests.post', return_value=mock_response) as mock_post:
            results = tool.search("test query")
            
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0]["title"], "Test Title")
            self.assertEqual(results[0]["url"], "http://test.com")
            self.assertEqual(results[0]["content"], "Test snippet")
            
            mock_post.assert_called_once()
            args, kwargs = mock_post.call_args
            self.assertIn("https://google.serper.dev/search", args[0])
            self.assertEqual(kwargs["headers"]["X-API-KEY"], "test-key")

    def test_search_answer_box(self):
        tool = SerperTool(api_key="test-key")
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "answerBox": {
                "title": "Answer",
                "answer": "The answer is 42"
            }
        }
        
        with patch('requests.post', return_value=mock_response):
            results = tool.search("meaning of life")
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0]["content"], "The answer is 42")

    def test_missing_api_key(self):
        # We explicitly pass None to override any env var
        tool = SerperTool(api_key=None)
        # Mock the config to ensure it doesn't pick up from env
        with patch('src.config.Config.SERPER_API_KEY', None):
             # Re-init to pick up the mocked config
             tool = SerperTool(api_key=None)
             with self.assertRaises(ValueError):
                tool.search("test")

if __name__ == '__main__':
    unittest.main()
