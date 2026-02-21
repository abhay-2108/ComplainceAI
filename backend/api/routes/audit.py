from fastapi import APIRouter
from backend.database import db

router = APIRouter()

@router.get("/")
async def get_audit_logs(limit: int = 100):
    docs = await db.get_audit_logs(limit=limit)
    result = []
    for d in docs:
        result.append({
            "id": d.get("transaction_id", "N/A"),
            "timestamp": d.get("timestamp", "N/A"),
            "type": d.get("transaction_type", "N/A"),
            "amount": d.get("amount", 0),
            "account": d.get("account_id", "N/A"),
            "risk_level": d.get("risk_level", "N/A"),
            "risk_score": d.get("risk_score", 0),
            "flagged": d.get("violation_flag", False),
        })
    return result
