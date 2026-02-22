from fastapi import APIRouter, HTTPException
from backend.models.schemas import Violation
from backend.database import db
from typing import List
from pydantic import BaseModel
from typing import Optional
import datetime

router = APIRouter()


async def _enrich_violation(r) -> dict:
    """
    Merge violation doc with the original transaction doc
    so we always have the full data (banks, amounts, currencies, etc).
    """
    txn = await db.db.transactions.find_one({"transaction_id": r["transaction_id"]})
    if txn:
        # Transaction fields take priority for raw data; violation fields for review/explanation
        merged = {**txn, **r}
    else:
        merged = r
    return merged


def build_violation(r) -> Violation:
    """Build a Violation response from a merged DB document."""
    return Violation(
        id=r['transaction_id'],
        type=r.get('payment_format') or r.get('transaction_type', 'UNKNOWN'),
        source=r.get('account_id') or str(r.get('from_bank', 'N/A')),
        date=r.get('timestamp', 'N/A'),
        status=r.get('review_status', 'pending').capitalize(),
        riskScore=r.get('risk_score', 0),
        explanation=r.get('explanation', 'Analysis pending — this transaction is queued for AI review.'),
        # Rich details from transaction
        amount_paid=r.get('amount_paid') or r.get('amount'),
        amount_received=r.get('amount_received') or r.get('amount'),
        from_bank=str(r.get('from_bank', 'N/A')),
        to_bank=str(r.get('to_bank', 'N/A')),
        payment_currency=r.get('payment_currency', 'USD'),
        receiving_currency=r.get('receiving_currency', 'USD'),
        payment_format=r.get('payment_format') or r.get('transaction_type', 'N/A'),
        # Human review
        review_status=r.get('review_status', 'pending'),
        reviewed_by=r.get('reviewed_by'),
        review_notes=r.get('review_notes'),
        review_timestamp=r.get('review_timestamp'),
    )


@router.get("/", response_model=List[Violation])
async def get_violations():
    results = await db.get_violations()
    enriched = []
    for r in results:
        merged = await _enrich_violation(r)
        enriched.append(build_violation(merged))
    return enriched


@router.get("/{violation_id}", response_model=Violation)
async def get_violation(violation_id: str):
    r = await db.get_violation_by_id(violation_id)
    if not r:
        raise HTTPException(status_code=404, detail="Violation not found")
    merged = await _enrich_violation(r)
    return build_violation(merged)


@router.get("/{violation_id}/activities")
async def get_violation_activities(violation_id: str):
    """Return the reasoning chain logs for a specific violation."""
    try:
        logs = await db.get_agent_activities(transaction_id=violation_id, limit=20)
        for log in logs:
            if "_id" in log:
                log["_id"] = str(log["_id"])
            if "time" not in log and "timestamp" in log:
                log["time"] = log["timestamp"][:16].replace("T", " ")
        return sorted(logs, key=lambda x: x.get("timestamp", ""))
    except Exception as e:
        print(f"Error fetching violation activities: {e}")
        return []


# --- Human Review Endpoints ---

class ReviewAction(BaseModel):
    action: str  # "resolve" or "escalate"
    reviewer: Optional[str] = "Compliance Officer"
    notes: Optional[str] = None


@router.post("/{violation_id}/review")
async def review_violation(violation_id: str, review: ReviewAction):
    """Human-in-the-loop: resolve or escalate a violation."""
    r = await db.get_violation_by_id(violation_id)
    if not r:
        raise HTTPException(status_code=404, detail="Violation not found")

    if review.action not in ["resolve", "escalate"]:
        raise HTTPException(status_code=400, detail="Action must be 'resolve' or 'escalate'")

    new_status = "resolved" if review.action == "resolve" else "escalated"

    update = {
        "review_status": new_status,
        "reviewed_by": review.reviewer,
        "review_notes": review.notes or f"Case {new_status} by {review.reviewer}",
        "review_timestamp": datetime.datetime.utcnow().isoformat(),
    }

    await db.db.violations.update_one(
        {"transaction_id": violation_id},
        {"$set": update}
    )

    # Also log this as an agent activity
    await db.insert_agent_activity({
        "agent": "human_reviewer",
        "event": f"Violation {violation_id} {new_status} by {review.reviewer}",
        "status": "success" if new_status == "resolved" else "warn",
        "transaction_id": violation_id,
    })

    return {"status": new_status, "message": f"Violation {violation_id} has been {new_status}."}
