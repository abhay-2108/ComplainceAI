from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.models.schemas import Policy
from backend.rag.rag_service import rag_service
from backend.database import db
import os
from typing import List

router = APIRouter()

@router.post("/upload", response_model=dict)
async def upload_policy(file: UploadFile = File(...)):
    # 1. Save file temporarily
    temp_path = f"backend/temp_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # 2. Process via RAG Service
        success = await rag_service.ingest_policy(temp_path, file.filename)
        
        if success:
            return {"status": "success", "message": f"Policy {file.filename} processed and indexed."}
        else:
            raise HTTPException(status_code=500, detail="Policy ingestion failed.")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/", response_model=List[Policy])
async def get_policies():
    policies = await db.db.policies.find().to_list(100)
    for p in policies:
        p["id"] = None # Optional: handle ID mapping
    return policies
