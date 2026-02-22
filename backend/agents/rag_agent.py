from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
from backend.config.settings import settings

class PolicyRAGAgent:
    def get_agent(self):
        return Agent(
            role='Policy Retrieval Expert',
            goal='Find relevant compliance policy sections for a given transaction type.',
            backstory='Master of semantic search and regulatory documentation. You provide the legal evidence needed for compliance analysis.',
            llm=ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL_NAME,
                google_api_key=settings.GOOGLE_API_KEY
            ),
            verbose=True,
            allow_delegation=False
        )
