from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
from backend.config.settings import settings

class DetectionAgent:
    def get_agent(self):
        return Agent(
            role='ML Prediction Specialist',
            goal='Analyze transaction data using machine learning models to identify potential risks.',
            backstory='Specialized in risk assessment and anomaly detection. You translate numerical scores into actionable compliance flags.',
            llm=ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL_NAME,
                google_api_key=settings.GOOGLE_API_KEY
            ),
            verbose=True,
            allow_delegation=False
        )
