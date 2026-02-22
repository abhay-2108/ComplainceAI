from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
from backend.config.settings import settings

class ExplanationAgent:
    def get_agent(self):
        return Agent(
            role='Explanation Agent',
            goal='Generate clear, professional explanations for transactions.',
            backstory='Expert in regulatory communication. You bridge the gap between AI findings and human auditors by providing clear reasoning.',
            llm=ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL_NAME,
                google_api_key=settings.GOOGLE_API_KEY
            ),
            verbose=True,
            allow_delegation=False
        )
