import requests
import json
from typing import List, Dict, Optional
from src.config import Config

class SerperTool:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or Config.SERPER_API_KEY
        if not self.api_key:
            # We don't raise error immediately to allow instantiation for testing, 
            # but search will fail if key is missing.
            pass
        
        self.url = "https://google.serper.dev/search"

    def search(self, query: str, k: int = 5) -> List[Dict[str, str]]:
        """
        Executes a Google Search using Serper API.
        Returns a list of dictionaries with title, url, and content.
        """
        if not self.api_key:
             raise ValueError("SERPER_API_KEY is not set")

        headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }
        payload = json.dumps({
            "q": query,
            "num": k
        })

        try:
            response = requests.post(self.url, headers=headers, data=payload)
            response.raise_for_status()
            results = response.json()
            
            structured_results = []
            
            # Handle 'organic' results
            if "organic" in results:
                for result in results["organic"]:
                    structured_results.append({
                        "title": result.get("title", ""),
                        "url": result.get("link", ""),
                        "content": result.get("snippet", "")
                    })
            
            # Fallback if no organic results but 'answerBox' exists
            if not structured_results and "answerBox" in results:
                 box = results["answerBox"]
                 structured_results.append({
                     "title": box.get("title", "Answer"),
                     "url": "",
                     "content": box.get("snippet", "") or box.get("answer", "")
                 })

            return structured_results

        except Exception as e:
            print(f"Error searching Serper: {e}")
            return []

    def search_images(self, query: str, k: int = 5) -> List[Dict[str, str]]:
        """
        Executes a Google Image Search using Serper API.
        Returns a list of dictionaries with title, imageUrl, and sourceUrl.
        """
        if not self.api_key:
             raise ValueError("SERPER_API_KEY is not set")

        headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }
        payload = json.dumps({
            "q": query,
            "num": k
        })
        
        # Use images endpoint
        url = "https://google.serper.dev/images"

        try:
            response = requests.post(url, headers=headers, data=payload)
            response.raise_for_status()
            results = response.json()
            
            structured_results = []
            
            if "images" in results:
                for result in results["images"]:
                    structured_results.append({
                        "title": result.get("title", ""),
                        "url": result.get("imageUrl", ""),
                        "source_url": result.get("link", ""),
                        "width": result.get("width"),
                        "height": result.get("height")
                    })
            
            return structured_results

        except Exception as e:
            print(f"Error searching images on Serper: {e}")
            return []
