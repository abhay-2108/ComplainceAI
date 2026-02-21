from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.rag.rag_service import rag_service
from backend.database import db
import os
from typing import List

router = APIRouter()

@router.post("/upload", response_model=dict)
async def upload_policy(file: UploadFile = File(...)):
    temp_path = f"backend/temp_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())

        result = await rag_service.ingest_policy(temp_path, file.filename)

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("reason", "Policy ingestion failed."))

        if result.get("skipped"):
            return {
                "status": "skipped",
                "message": f"'{file.filename}' was already indexed. No duplicate embeddings generated."
            }

        return {
            "status": "success",
            "message": f"Policy '{file.filename}' processed and indexed successfully."
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/", response_model=List[dict])
async def get_policies():
    policies = await db.db.policies.find({}, {"_id": 0, "content_hash": 0}).to_list(200)
    result = []
    for p in policies:
        result.append({
            "name":         p.get("name", "Unknown"),
            "date":         p.get("upload_date", "N/A"),
            "status":       p.get("status", "Active"),
            "size":         "N/A",
            "chunks_count": p.get("chunks_count", 0),
        })
    return result
