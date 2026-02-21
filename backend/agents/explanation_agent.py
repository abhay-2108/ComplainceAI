from crewai import Agent
from langchain_ollama import OllamaLLM
from backend.config.settings import settings

class ExplanationAgent:
    def get_agent(self):
        return Agent(
            role='Compliance Explainer',
            goal='Generate clear, professional explanations for flagged violations based on policy context.',
            backstory='Expert in regulatory communication. You bridge the gap between AI findings and human auditors by providing clear reasoning.',
            llm=f"ollama/{settings.LLM_MODEL_NAME}",
            verbose=True,
            allow_delegation=False
        )
