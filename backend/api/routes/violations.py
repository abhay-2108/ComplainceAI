from fastapi import APIRouter, HTTPException
from backend.models.schemas import Violation
from backend.database import db
from typing import List

router = APIRouter()

@router.get("/", response_model=List[Violation])
async def get_violations():
    results = await db.get_violations()
    violations = []
    for r in results:
        violations.append(Violation(
            id=r['transaction_id'],
            type=r.get('transaction_type', 'UNKNOWN'),
            source=r.get('account_id', 'N/A'),
            date=r.get('timestamp', 'N/A'),
            status="Flagged",
            riskScore=r.get('risk_score', 0),
            explanation=r.get('explanation', "AI-generated reasoning.")
        ))
    return violations

@router.get("/{violation_id}", response_model=Violation)
async def get_violation(violation_id: str):
    r = await db.get_violation_by_id(violation_id)
    if not r:
        raise HTTPException(status_code=404, detail="Violation not found")
        
    return Violation(
        id=r['transaction_id'],
        type=r.get('transaction_type', 'UNKNOWN'),
        source=r.get('account_id', 'N/A'),
        date=r.get('timestamp', 'N/A'),
        status="Flagged",
        riskScore=r.get('risk_score', 0),
        explanation=r.get('explanation', "AI-generated reasoning.")
    )
