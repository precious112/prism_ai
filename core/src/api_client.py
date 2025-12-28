import requests
from src.config import Config

class ApiClient:
    def __init__(self):
        self.base_url = Config.API_URL
        self.headers = {
            "Content-Type": "application/json",
            "x-worker-secret": Config.WORKER_API_KEY
        }

    def save_research_result(self, request_id: str, content: dict):
        """
        Saves an intermediate research result (e.g., a section draft).
        """
        url = f"{self.base_url}/research/worker/result/{request_id}"
        response = requests.post(url, json={"content": content}, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def save_final_response(self, chat_id: str, content: str):
        """
        Saves the final aggregated report as a new message in the chat.
        """
        url = f"{self.base_url}/chats/{chat_id}/messages/worker"
        response = requests.post(url, json={"content": content, "role": "assistant"}, headers=self.headers)
        response.raise_for_status()
        return response.json()
