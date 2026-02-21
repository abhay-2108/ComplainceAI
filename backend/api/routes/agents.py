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
async def get_agent_activity(limit: int = 12):
    """Return the most recent processed transactions as live agent activity."""
    try:
        docs = await db.db.transactions.find(
            {"is_processed": True},
            {"transaction_id": 1, "risk_level": 1, "risk_score": 1,
             "violation_flag": 1, "timestamp": 1, "payment_format": 1,
             "transaction_type": 1, "_id": 0}
        ).sort("timestamp", -1).to_list(limit)

        entries = []
        for d in docs:
            tid        = d.get("transaction_id", "TXN-???")
            score_raw  = d.get("risk_score", 0)
            score      = score_raw / 100 if score_raw > 1 else score_raw
            level      = (d.get("risk_level") or "LOW").upper()
            flagged    = d.get("violation_flag", False)
            ts         = str(d.get("timestamp", ""))[:16].replace("T", " ")
            pf         = d.get("payment_format") or d.get("transaction_type", "")

            if flagged:
                event  = f"{tid} flagged — RF score {score:.2f} ({level})"
                status = "danger" if level == "HIGH" else "warn"
            else:
                event  = f"{tid} cleared — RF score {score:.2f} (LOW)"
                status = "success"

            entries.append({"time": ts, "event": event, "status": status, "agent": "violation"})

            if flagged:
                entries.append({
                    "time": ts,
                    "event": f"RAG policy context retrieved for {pf or 'transaction'} type",
                    "status": "info",
                    "agent": "explanation"
                })

        return entries[:limit]
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
