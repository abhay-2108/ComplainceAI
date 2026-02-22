import logging
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from backend.config.settings import settings

logger = logging.getLogger(__name__)

class EmbeddingModel:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingModel, cls).__new__(cls)
            try:
                cls._instance.embeddings = GoogleGenerativeAIEmbeddings(
                    model=settings.GEMINI_EMBEDDING_MODEL,
                    google_api_key=settings.GOOGLE_API_KEY
                )
                logger.info(f"Gemini Embedding Service initialized for model: {settings.GEMINI_EMBEDDING_MODEL}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Embedding Service: {e}")
                cls._instance.embeddings = None
        return cls._instance

    def encode(self, text: str):
        """
        Synchronously get embeddings from Gemini API.
        """
        if not self.embeddings:
            logger.warning("Gemini Embeddings not initialized. Returning fallback zero vector.")
            return [0.0] * 768

        try:
            return self.embeddings.embed_query(text)
        except Exception as e:
            logger.error(f"Error calling Gemini embeddings: {e}")
            return [0.0] * 768

embedding_service = EmbeddingModel()
