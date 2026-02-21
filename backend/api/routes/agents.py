from fastapi import APIRouter
from backend.models.schemas import AgentStatus
from typing import List

router = APIRouter()

@router.get("/status", response_model=List[AgentStatus])
async def get_agents_status():
    return [
        {"id": "policy", "status": "Active"},
        {"id": "monitoring", "status": "Running"},
        {"id": "violation", "status": "Active"},
        {"id": "explanation", "status": "Standby"},
        {"id": "reporting", "status": "Scheduled"}
    ]

@router.post("/run-agents")
@router.post("/process-unprocessed")
async def process_unprocessed():
    from backend.agents.crew import compliance_crew
    await compliance_crew.batch_process_unprocessed()
    return {"status": "success", "message": "Autonomous agents triggered for processing."}
