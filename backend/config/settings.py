import os
import logging
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "Secure AI Compliance System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # MongoDB
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "compliance_ai")
    
    # ML Model
    MODEL_PATH: str = os.getenv("MODEL_PATH", "backend/models/random_forest_model.pkl")
    
    # RAG & Embeddings
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", "backend/db/chroma")
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
    
    # LLM (Gemini)
    GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY")
    GEMINI_MODEL_NAME: str = "gemini-1.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "models/embedding-001"

    # LLM (Ollama - Keeping for backward compatibility or dual use)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL_NAME: str = os.getenv("OLLAMA_MODEL_NAME", "llama3")
    LLM_MODEL_NAME: Optional[str] = os.getenv("LLM_MODEL_NAME")
    
    # Security
    MASKING_ENABLED: bool = True
    SECRET_KEY: str = os.getenv("SECRET_KEY", "7038cbe22c83307f594519951666993a652e850b571694f4")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    class Config:
        env_file = "backend/.env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()

# Post-processing to ensure CrewAI/LiteLLM provider prefix and strip invalid "models/"
# Propagate API keys to environment for LiteLLM/CrewAI authentication
if settings.GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY
if settings.GEMINI_MODEL_NAME:
    os.environ["GEMINI_MODEL_NAME"] = settings.GEMINI_MODEL_NAME

# Post-processing normalization (Lean version)
if settings.GEMINI_MODEL_NAME:
    settings.GEMINI_MODEL_NAME = settings.GEMINI_MODEL_NAME.replace("models/", "").replace("gemini/", "")
    # Ensure it's gemini-1.5
    settings.GEMINI_MODEL_NAME = settings.GEMINI_MODEL_NAME.replace("gemini-2.5", "gemini-1.5")

# Setup logging configuration
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("backend")
logger.info(f"Final LLM Model configured: {settings.GEMINI_MODEL_NAME}")
