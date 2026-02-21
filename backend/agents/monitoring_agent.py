from crewai import Agent
from langchain_ollama import OllamaLLM
from backend.config.settings import settings
from backend.database import db

class MonitoringAgent:
    def get_agent(self):
        return Agent(
            role='Database Monitor',
            goal='Identify and fetch unprocessed transactions from the compliance database.',
            backstory='Expert in database systems and real-time data monitoring. You ensure no transaction goes unanalyzed.',
            llm=f"ollama/{settings.LLM_MODEL_NAME}",
            verbose=True,
            allow_delegation=False
        )
