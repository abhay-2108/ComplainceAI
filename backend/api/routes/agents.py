from fastapi import APIRouter
from backend.models.schemas import AgentStatus
from backend.database import db
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status", response_model=List[dict])
async def get_agents_status():
    """Return real live counts to represent each agent's state."""
    from backend.agents.crew import compliance_crew

    is_monitoring = compliance_crew.is_running

    # Pull real counts from DB to make each agent status meaningful
    try:
        total_policies    = await db.db.policies.count_documents({})
        total_chunks      = 0
        async for p in db.db.policies.find({}, {"chunks_count": 1}):
            total_chunks += p.get("chunks_count", 0)

        total_processed   = await db.db.transactions.count_documents({"is_processed": True})
        total_pending     = await db.db.transactions.count_documents({"is_processed": False})
        total_violations  = await db.db.violations.count_documents({})
        total_hv          = await db.db.violations.count_documents({"risk_level": "HIGH"})
    except Exception as e:
        logger.warning(f"Agents status DB query failed: {e}")
        total_policies = total_chunks = total_processed = total_pending = total_violations = total_hv = 0

    return [
        {
            "id": "policy",
            "status": "Active" if total_policies > 0 else "Idle",
            "policies_indexed": total_policies,
            "total_chunks": total_chunks,
            "last_active": None,
        },
        {
            "id": "monitoring",
            "status": "Running" if is_monitoring else "Stopped",
            "pending_transactions": total_pending,
            "processed_total": total_processed,
            "last_active": None,
        },
        {
            "id": "violation",
            "status": "Active" if total_processed > 0 else "Idle",
            "total_violations": total_violations,
            "high_risk": total_hv,
            "last_active": None,
        },
        {
            "id": "explanation",
            "status": "Active" if total_violations > 0 else "Standby",
            "explanations_generated": total_violations,
            "last_active": None,
        },
        {
            "id": "reporting",
            "status": "Active" if total_processed > 0 else "Standby",
            "records_in_report": total_processed,
            "last_active": None,
        },
    ]


@router.get("/activity")
async def get_agent_activity(agent: str = None, limit: int = 16):
    """Return live activity logs from the agent_activities collection."""
    try:
        # Map frontend IDs to DB agent names if necessary
        db_agent = None
        if agent:
            mapping = {
                "policy": "policy_rag_agent",
                "violation": "violation_detector",
                "explanation": "explanation_agent",
                "reporting": "reporting_agent",
                "monitoring": "monitoring"
            }
            db_agent = mapping.get(agent, agent)

        logs = await db.get_agent_activities(agent_id=db_agent, limit=limit)
        
        # Format for frontend
        for log in logs:
            if "_id" in log:
                log["_id"] = str(log["_id"])
            if "time" not in log and "timestamp" in log:
                log["time"] = log["timestamp"][:16].replace("T", " ")
        
        return logs
    except Exception as e:
        logger.error(f"Activity fetch error: {e}")
        return []


@router.get("/monitoring-status")
async def get_monitoring_status():
    from backend.agents.crew import compliance_crew
    return {"is_running": compliance_crew.is_running}


@router.post("/start-monitoring")
async def start_monitoring():
    from backend.agents.crew import compliance_crew
    await compliance_crew.start_monitoring()
    return {"status": "success", "message": "Monitoring loop started."}


@router.post("/stop-monitoring")
async def stop_monitoring():
    from backend.agents.crew import compliance_crew
    await compliance_crew.stop_monitoring()
    return {"status": "success", "message": "Monitoring loop stopped."}


@router.post("/run-agents")
@router.post("/process-unprocessed")
async def process_unprocessed():
    from backend.agents.crew import compliance_crew
    await compliance_crew.batch_process_unprocessed(limit=20)
    return {"status": "success", "message": "Batch processing triggered."}
