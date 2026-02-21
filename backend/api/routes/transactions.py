from fastapi import APIRouter, HTTPException
from backend.models.schemas import Transaction
from backend.database import db
from typing import List
import uuid
import datetime

router = APIRouter()

@router.get("/", response_model=List[Transaction])
async def get_transactions(limit: int = 100):
    return await db.get_all_transactions(limit)

@router.post("/", response_model=dict)
async def create_transaction(txn: Transaction):
    # Ensure ID if not provided
    txn_data = txn.dict()
    if not txn_data.get('id'):
        txn_data['id'] = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    
    # Map to internal storage schema expected by other modules
    # In a larger app, use separate internal/external schemas
    internal_txn = {
        "transaction_id": txn_data['id'],
        "amount": txn_data['amount'],
        "transaction_type": txn_data['type'],
        "timestamp": str(txn_data['timestamp']),
        "account_id": txn_data['source'],
        "is_processed": False,
        "risk_score": None,
        "risk_level": None,
        "violation_flag": False
    }
    
    await db.insert_transaction(internal_txn)
    return {"status": "success", "id": txn_data['id']}
