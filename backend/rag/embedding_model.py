import logging
import httpx
from backend.config.settings import settings

logger = logging.getLogger(__name__)

class EmbeddingModel:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingModel, cls).__new__(cls)
            logger.info(f"Ollama Embedding Service initialized for model: {settings.EMBEDDING_MODEL_NAME}")
        return cls._instance

    def encode(self, text: str):
        """
        Synchronously get embeddings from Ollama API.
        Using a standard blocking request to maintain the existing 'encode' interface.
        """
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/embeddings",
                    json={
                        "model": settings.EMBEDDING_MODEL_NAME,
                        "prompt": text
                    }
                )
                if response.status_code == 200:
                    return response.json().get("embedding")
                else:
                    logger.error(f"Ollama Embedding Error: {response.text}")
                    return [0.0] * 768 # Fallback dimension for nomic-embed-text
        except Exception as e:
            logger.error(f"Error calling Ollama embeddings: {e}")
            return [0.0] * 768

embedding_service = EmbeddingModel()
