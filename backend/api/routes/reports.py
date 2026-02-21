from fastapi import APIRouter
from backend.database import db

router = APIRouter()

@router.get("/")
async def get_reports():
    return await db.get_reports_data()
