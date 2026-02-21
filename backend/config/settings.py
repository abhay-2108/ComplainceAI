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
    MODEL_PATH: str = os.getenv("MODEL_PATH", "backend/models/compliance_model.pkl")
    
    # RAG & Embeddings
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", "backend/db/chroma")
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
    
    # LLM (Ollama)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "llama3")
    
    # Security
    MASKING_ENABLED: bool = True
    SECRET_KEY: str = os.getenv("SECRET_KEY", "7038cbe22c83307f594519951666993a652e850b571694f4")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "L0Y3-mP5V5-8Z8C9-2X4M7-G1V6K-9B3S5-T8Q4R") # Use a valid Fernet key in prod
    
    class Config:
        env_file = "backend/.env"
        case_sensitive = True

settings = Settings()

# Setup logging configuration
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("backend")
