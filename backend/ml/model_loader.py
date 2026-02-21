import joblib
import os
import logging
from backend.config.settings import settings

logger = logging.getLogger(__name__)

class ModelLoader:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        if os.path.exists(settings.MODEL_PATH):
            try:
                self._model = joblib.load(settings.MODEL_PATH)
                logger.info(f"ML Model loaded successfully from {settings.MODEL_PATH}")
            except Exception as e:
                logger.error(f"Error loading ML model from {settings.MODEL_PATH}: {e}")
                self._model = None
        else:
            logger.warning(f"ML Model not found at {settings.MODEL_PATH}. Prediction service will use heuristic fallback.")
            self._model = None

    @property
    def model(self):
        return self._model

# Simple way to get the singleton instance
model_loader = ModelLoader()
