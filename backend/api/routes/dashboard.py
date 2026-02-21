from fastapi import APIRouter
from backend.models.schemas import DashboardMetrics
from backend.database import db

router = APIRouter()

@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics():
    metrics = await db.get_metrics()
    return metrics
