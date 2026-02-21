import pandas as pd
import numpy as np
import logging
from backend.ml.model_loader import model_loader
from backend.models.schemas import RiskInput, RiskOutput

logger = logging.getLogger(__name__)

class RiskPredictor:
    def __init__(self):
        self.loader = model_loader

    def predict(self, input_data: RiskInput) -> RiskOutput:
        try:
            # Prepare data for model
            data_dict = input_data.dict()
            
            if self.loader.model:
                # Convert to DataFrame as most sklearn models expect it
                df = pd.DataFrame([data_dict])
                
                # Mock feature engineering if necessary to match trained model
                # For this demo, we assume the model accepts these features directly
                
                # Inference
                # Assuming predict_proba for risk score [0, 1]
                try:
                    score = float(self.loader.model.predict_proba(df)[0][1])
                except (AttributeError, IndexError):
                    # Fallback to direct predict if predict_proba is unavailable
                    score = float(self.loader.model.predict(df)[0])
            else:
                # Heuristic Fallback logic
                logger.info("Using heuristic fallback for risk prediction")
                score = self._heuristic_predict(data_dict)

            # Risk Classification
            risk_level = "LOW"
            if score >= 0.7:
                risk_level = "HIGH"
            elif score >= 0.4:
                risk_level = "MEDIUM"

            return RiskOutput(
                risk_score=round(score, 4),
                risk_level=risk_level,
                is_violation=score >= 0.7
            )

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise e

    def _heuristic_predict(self, data: dict) -> float:
        # Simple heuristic for demo/fallback
        score = 0.1
        # Dataset amounts are very large (>1M is common)
        if data.get('amount', 0) > 1000000: score += 0.4
        if data.get('transaction_type') in ['Wire', 'WIRE_TRANSFER']: score += 0.2
        if data.get('transaction_type') == 'Bitcoin': score += 0.3
        if data.get('account_age', 0) < 30: score += 0.2
        if data.get('frequency', 0) > 10: score += 0.1
        return min(score, 1.0)

predictor = RiskPredictor()
