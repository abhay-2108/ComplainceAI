from crewai import Agent
from langchain_ollama import OllamaLLM
from backend.config.settings import settings

class DetectionAgent:
    def get_agent(self):
        return Agent(
            role='ML Prediction Specialist',
            goal='Analyze transaction data using machine learning models to identify potential risks.',
            backstory='Specialized in risk assessment and anomaly detection. You translate numerical scores into actionable compliance flags.',
            llm=f"ollama/{settings.LLM_MODEL_NAME}",
            verbose=True,
            allow_delegation=False
        )
