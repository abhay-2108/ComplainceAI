from crewai import Agent
from langchain_ollama import OllamaLLM
from backend.config.settings import settings

class ReportingAgent:
    def get_agent(self):
        return Agent(
            role='Compliance Reporter',
            goal='Finalize violation incident reports and ensure data integrity in results.',
            backstory='Responsible for audit trails and stakeholder reporting. You ensure every finding is accurately documented and reflected on the dashboard.',
            llm=f"ollama/{settings.LLM_MODEL_NAME}",
            verbose=True,
            allow_delegation=False
        )
