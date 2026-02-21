from fastapi import APIRouter
from backend.database import db

router = APIRouter()

@router.get("/analytics")
async def get_predictions_analytics():
    return await db.get_predictions_analytics()
