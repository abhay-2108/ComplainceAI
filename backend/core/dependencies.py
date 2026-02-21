from typing import Generator
from backend.database import db

async def get_database():
    return db.db
