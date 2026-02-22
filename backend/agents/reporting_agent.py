from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
from backend.config.settings import settings

class ReportingAgent:
    def get_agent(self):
        return Agent(
            role='Reporting Agent',
            goal='Finalize violation incident reports and ensure data integrity.',
            backstory='Responsible for audit trails and stakeholder reporting. You ensure every finding is accurately documented and reflected on the dashboard.',
            llm=ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL_NAME,
                google_api_key=settings.GOOGLE_API_KEY
            ),
            verbose=True,
            allow_delegation=False
        )
