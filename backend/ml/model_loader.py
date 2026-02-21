import joblib
import os
import logging
from backend.config.settings import settings

logger = logging.getLogger(__name__)


class ModelLoader:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
            cls._instance.model    = None   # sklearn RandomForestClassifier
            cls._instance.encoders = {}     # dict[str, LabelEncoder]
            cls._instance.features = []     # ordered list of feature names
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        path = settings.MODEL_PATH
        if not os.path.exists(path):
            logger.warning(f"ML Model not found at {path}. Heuristic fallback active.")
            return
        try:
            pipeline = joblib.load(path)

            # New format: dict with keys 'model', 'encoders', 'features'
            if isinstance(pipeline, dict):
                self.model    = pipeline.get("model")
                self.encoders = pipeline.get("encoders", {})
                self.features = pipeline.get("features", [])
                logger.info(
                    f"Pipeline loaded from {path}. "
                    f"Features ({len(self.features)}): {self.features}"
                )
            else:
                # Legacy: bare sklearn model (old pkl format)
                self.model    = pipeline
                self.encoders = {}
                self.features = list(getattr(pipeline, "feature_names_in_", []))
                logger.info(f"Bare model loaded from {path} (legacy format).")

        except Exception as e:
            logger.error(f"Error loading ML model from {path}: {e}")
            self.model    = None
            self.encoders = {}
            self.features = []

    @property
    def is_ready(self) -> bool:
        return self.model is not None


# Singleton
model_loader = ModelLoader()
