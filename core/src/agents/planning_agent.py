from typing import List
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.language_models.chat_models import BaseChatModel

class Section(BaseModel):
    title: str = Field(description="The title of the section")
    description: str = Field(description="A brief description of what this section should cover")

class ResearchPlan(BaseModel):
    sections: List[Section] = Field(description="List of sections for the research report")

class PlanningAgent:
    def __init__(self, model: BaseChatModel):
        self.model = model
        self.structured_llm = model.with_structured_output(ResearchPlan)
        
    def generate_plan(self, query: str) -> ResearchPlan:
        system_prompt = """You are an expert research planner.
        Given a user query, create a detailed Table of Contents (ToC) for a comprehensive research report.
        The ToC should be logical, cover all aspects of the query, and include an Introduction and Conclusion.
        """
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "{query}")
        ])
        
        chain = prompt | self.structured_llm
        return chain.invoke({"query": query})
