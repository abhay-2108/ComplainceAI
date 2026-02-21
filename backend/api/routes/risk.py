from fastapi import APIRouter, HTTPException
from backend.models.schemas import RiskInput, RiskOutput
from backend.ml.predictor import predictor
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/predict-risk", response_model=RiskOutput, tags=["ML"])
async def predict_risk(data: RiskInput):
    """
    Predict the compliance risk score for a transaction.
    
    classification logic:
    - risk_score >= 0.80 -> HIGH
    - risk_score >= 0.50 -> MEDIUM
    - else LOW
    """
    try:
        result = predictor.predict(data)
        return result
    except Exception as e:
        logger.error(f"Error in predict_risk endpoint: {e}")
        raise HTTPException(status_code=500, detail="Risk prediction failed")
