import logging
import asyncio
from fastapi import FastAPI
from backend.database import db

logger = logging.getLogger(__name__)

async def start_app_handler(app: FastAPI) -> None:
    logger.info("Connecting to MongoDB...")
    await db.connect_to_storage()
    await db.create_indexes()
    
    # Autonomous monitoring now requires manual trigger via API/Dashboard
    # from backend.agents.crew import compliance_crew
    # asyncio.create_task(compliance_crew.run_autonomous_loop())
    
    logger.info("Application startup complete. Database connected.")

async def stop_app_handler(app: FastAPI) -> None:
    logger.info("Closing MongoDB connection...")
    await db.close_storage_connection()
    logger.info("Application shutdown complete.")
