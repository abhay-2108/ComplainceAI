from fastapi import APIRouter
from backend.rag.retriever import retriever
from backend.rag.rag_service import rag_service
from typing import Dict, Any

router = APIRouter()

@router.get("/context")
async def get_policy_context(query: str):
    context = retriever.retrieve(query)
    return {"query": query, "context": context}

@router.post("/generate-explanation")
async def generate_explanation(data: Dict[str, Any]):
    # This expects a dictionary with 'transaction_data' and 'policy_context'
    txn = data.get("transaction_data", {})
    context = data.get("policy_context", [])
    explanation = await rag_service.generate_explanation(txn, context)
    return {"explanation": explanation}
