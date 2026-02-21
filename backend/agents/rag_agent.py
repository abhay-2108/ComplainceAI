from crewai import Agent
from langchain_ollama import OllamaLLM
from backend.config.settings import settings

class PolicyRAGAgent:
    def get_agent(self):
        return Agent(
            role='Policy Retrieval Expert',
            goal='Find relevant compliance policy sections for a given transaction type.',
            backstory='Master of semantic search and regulatory documentation. You provide the legal evidence needed for compliance analysis.',
            llm=f"ollama/{settings.LLM_MODEL_NAME}",
            verbose=True,
            allow_delegation=False
        )
