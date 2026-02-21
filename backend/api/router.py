from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from backend.database import db
from backend.rag.processor import processor
from backend.rag.vectordb import vector_store
from backend.agents.crew import compliance_crew
from backend.ml.model_loader import model_loader
import uuid
import datetime

router = APIRouter()

@router.post("/upload-policy")
async def upload_policy(file: UploadFile = File(...)):
    # 1. Save file temporarily
    file_path = f"backend/temp_{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # 2. Extract and Chunk
    text = processor.extract_text(file_path)
    chunks = processor.chunk_text(text)
    
    # 3. Store in Vector DB
    metadatas = [{"source": file.filename, "type": "policy"}] * len(chunks)
    ids = [str(uuid.uuid4()) for _ in range(len(chunks))]
    vector_store.add_documents(chunks, metadatas, ids)
    
    # 4. Save metadata to MongoDB
    await db.db.policies.insert_one({
        "filename": file.filename,
        "upload_date": datetime.datetime.now(),
        "chunks_count": len(chunks)
    })
    
    return {"status": "Success", "message": f"Policy {file.filename} processed and indexed."}

@router.get("/violations")
async def get_violations():
    violations = await db.db.violations.find().to_list(100)
    for v in violations:
        v["_id"] = str(v["_id"])
    return violations

@router.get("/dashboard-metrics")
async def get_metrics():
    violations_count = await db.db.violations.count_documents({})
    high_risk = await db.db.violations.count_documents({"status": "High"})
    
    return {
        "total_violations": violations_count,
        "critical_risks": high_risk,
        "health_score": "98.5%",  # Dynamic calculation would go here
        "records_scanned": "2.4M"
    }

@router.post("/scan-data")
async def scan_data(data: dict, background_tasks: BackgroundTasks):
    # Run compliance check
    result = compliance_crew.run_check(data)
    
    if result.get("status") in ["High", "Medium"]:
        # Save violation to DB
        violation_doc = {
            "id": f"V-{uuid.uuid4().hex[:4].upper()}",
            "type": data.get("type", "Unknown"),
            "source": data.get("source", "Unknown"),
            "date": datetime.datetime.now().strftime("%Y-%m-%d"),
            "status": result["status"],
            "riskScore": result["risk_score"],
            "explanation": result["explanation"]
        }
        await db.db.violations.insert_one(violation_doc)
    
    return result

@router.get("/agents-status")
async def get_agents_status():
    # Mocking agent status for the dashboard
    return [
        {"id": "policy", "status": "Active"},
        {"id": "monitoring", "status": "Running"},
        {"id": "violation", "status": "Active"},
        {"id": "explanation", "status": "Standby"},
        {"id": "reporting", "status": "Scheduled"}
    ]
