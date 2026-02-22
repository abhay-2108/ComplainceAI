import logging
import datetime
from backend.core.celery_app import celery_app
from backend.config.settings import settings

logger = logging.getLogger(__name__)


def get_fast_explanation(transaction_data, risk_result, context_chunks):
    """
    Direct Gemini API call for explanation — 10x faster than CrewAI multi-agent.
    Uses the new google-genai SDK with gemini-2.5-flash.
    """
    try:
        from google import genai
        client = genai.Client(api_key=settings.GOOGLE_API_KEY)

        prompt = f"""You are a senior AML compliance officer. Analyze this flagged transaction and provide a concise professional explanation (3-4 sentences).

Transaction: {transaction_data.get('transaction_id')}
Amount: ${transaction_data.get('amount', 0):,.2f}
Type: {transaction_data.get('transaction_type') or transaction_data.get('payment_format', 'N/A')}
From: {transaction_data.get('sender_bank') or transaction_data.get('from_bank', 'N/A')} → To: {transaction_data.get('receiver_bank') or transaction_data.get('to_bank', 'N/A')}
Risk Score: {risk_result.get('risk_score', 0):.2%} ({risk_result.get('risk_level', 'UNKNOWN')})

Policy Context: {'; '.join(context_chunks[:2]) if context_chunks else 'General AML policies apply.'}

Provide your analysis focusing on: why this was flagged, the specific risk indicators, and recommended action."""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        logger.warning(f"Gemini direct call failed: {e}")
        return f"High-risk transaction flagged by ML model. Risk score: {risk_result.get('risk_score', 0):.2%}. Manual review recommended."



@celery_app.task(bind=True, name="process_transaction_task", max_retries=2)
def process_transaction_task(self, transaction_data):
    """
    Fully synchronous Celery task — uses pymongo + direct Gemini API.
    Processes one transaction in ~3-5 seconds (vs 60s with CrewAI).
    """
    txn_id = transaction_data.get("transaction_id")
    logger.info(f"Celery Worker: Processing {txn_id}")

    try:
        from pymongo import MongoClient
        from backend.ml.predictor import predictor
        from backend.rag.retriever import retriever

        # Sync MongoDB connection
        client = MongoClient(settings.MONGODB_URL)
        db = client[settings.DATABASE_NAME]

        def log_activity(agent, event, status, txn_id, explanation=None):
            doc = {
                "agent": agent,
                "event": event,
                "status": status,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "transaction_id": txn_id,
            }
            if explanation:
                doc["explanation"] = explanation
            try:
                db.agent_activity.insert_one(doc)
            except Exception as e:
                logger.warning(f"Log failed: {e}")

        # Phase 1: Log Start
        log_activity("monitoring", f"Processing {txn_id}", "info", txn_id)

        # Phase 2: ML Prediction
        risk_result = predictor.predict_from_transaction(transaction_data)
        logger.info(f"ML Score: {risk_result.risk_score:.4f} ({risk_result.risk_level})")

        log_activity(
            "violation_detector",
            f"RF Score: {risk_result.risk_score:.2f} ({risk_result.risk_level})",
            "success" if not risk_result.is_violation else "warn",
            txn_id,
        )

        explanation = "No violation detected by ML model."

        if risk_result.is_violation:
            # Phase 3: RAG Retrieval
            query = f"Compliance rules for {transaction_data.get('transaction_type') or transaction_data.get('payment_format', 'general transaction')}"
            context = retriever.retrieve(query)
            logger.info(f"RAG: {len(context)} chunks retrieved")

            log_activity("policy_rag_agent", f"Retrieved {len(context)} policy chunks", "info", txn_id)

            # Phase 4: Direct Gemini API (FAST — replaces slow CrewAI)
            logger.info(f"Gemini: Generating explanation for {txn_id}...")
            explanation = get_fast_explanation(
                transaction_data, risk_result.dict(), context
            )
            logger.info(f"Gemini: Done for {txn_id}")

            log_activity("explanation_agent", f"AI explanation generated for {txn_id}", "success", txn_id)
        else:
            logger.info(f"Low risk for {txn_id}. Skipping LLM.")

        # Phase 5: Update DB
        db.transactions.update_one(
            {"transaction_id": txn_id},
            {"$set": {
                "risk_score": risk_result.risk_score * 100,
                "risk_level": risk_result.risk_level,
                "violation_flag": risk_result.is_violation,
                "is_processed": True,
            }},
        )

        if risk_result.is_violation:
            txn_doc = db.transactions.find_one({"transaction_id": txn_id})
            if txn_doc:
                db.violations.update_one(
                    {"transaction_id": txn_id}, {"$set": txn_doc}, upsert=True
                )
                db.violations.update_one(
                    {"transaction_id": txn_id}, {"$set": {"explanation": explanation}}
                )

        # Phase 6: Final log
        log_activity(
            "reporting_agent",
            f"Completed: {txn_id} → {risk_result.risk_level}",
            "success",
            txn_id,
            explanation=explanation if risk_result.is_violation else None,
        )

        logger.info(f"DONE: {txn_id} → {risk_result.risk_level}")
        client.close()
        return f"Success: {txn_id}"

    except Exception as exc:
        logger.error(f"Task failed for {txn_id}: {exc}", exc_info=True)
        raise self.retry(exc=exc, countdown=min(30 * (self.request.retries + 1), 120))
