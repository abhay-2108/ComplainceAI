from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
from backend.config.settings import settings
from backend.database import db

class MonitoringAgent:
    def get_agent(self):
        return Agent(
            role='Database Monitor',
            goal='Identify and fetch unprocessed transactions from the compliance database.',
            backstory='Expert in database systems and real-time data monitoring. You ensure no transaction goes unanalyzed.',
            llm=ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL_NAME,
                google_api_key=settings.GOOGLE_API_KEY
            ),
            verbose=True,
            allow_delegation=False
        )
