import logging
import asyncio
from crewai import Crew, Task, Process
from backend.agents.monitoring_agent import MonitoringAgent
from backend.agents.detection_agent import DetectionAgent
from backend.agents.rag_agent import PolicyRAGAgent
from backend.agents.explanation_agent import ExplanationAgent
from backend.agents.reporting_agent import ReportingAgent
from backend.database import db
from backend.ml.predictor import predictor
from backend.rag.retriever import retriever
from backend.security.masking import masker
from backend.models.schemas import RiskInput
from contextvars import ContextVar
# from backend.tasks import process_transaction_task # Moved to lazy import inside methods

logger = logging.getLogger(__name__)
# Global context to track which transaction is being processed by the current task/thread
txn_context = ContextVar("transaction_id", default=None)

class ComplianceCrew:
    def __init__(self):
        # Initialize Agents
        self.monitoring_agent = MonitoringAgent().get_agent()
        self.detection_agent = DetectionAgent().get_agent()
        self.rag_agent = PolicyRAGAgent().get_agent()
        self.explanation_agent = ExplanationAgent().get_agent()
        self.reporting_agent = ReportingAgent().get_agent()
        
        # State Management
        self.is_running = False
        self._loop_task = None

    def agent_step_callback(self, step_data):
        """Callback to log every thought/action an agent takes."""
        try:
            import datetime
            agent_name = getattr(step_data, 'agent', 'Unknown Agent')
            
            activity = {
                "agent": agent_name.replace(" ", "_").lower(),
                "event": f"Agent {agent_name} is processing: {getattr(step_data, 'tool', 'Thinking...')}",
                "status": "info",
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "details": str(step_data),
                "transaction_id": txn_context.get()
            }
            # Sync telemetry is much more robust for threads/workers
            db.insert_agent_activity_sync(activity)
            
        except Exception as e:
            logger.error(f"Error in agent_step_callback: {e}")

    def create_crew(self, transaction_data: dict, policy_context: list, risk_result: dict):
        # Define Tasks
        task_explanation = Task(
            description=f"""
            Analyze the following flagged transaction and provide a clear explanation.
            Transaction: {masker.mask_dict(transaction_data)}
            Risk Result: {risk_result}
            Policy Context: {policy_context}
            """,
            agent=self.explanation_agent,
            expected_output="A professional human-readable compliance explanation."
        )

        task_reporting = Task(
            description="""
            Review the explanation and finalize the violation report. 
            Ensure all data is consistent and ready for the audit log.
            """,
            agent=self.reporting_agent,
            expected_output="Final audit-ready report content.",
            context=[task_explanation]
        )

        return Crew(
            agents=[self.explanation_agent, self.reporting_agent],
            tasks=[task_explanation, task_reporting],
            process=Process.sequential,
            verbose=True,
            step_callback=self.agent_step_callback
        )

    async def start_monitoring(self):
        """Start the autonomous monitoring loop if not already running."""
        if self.is_running:
            return
        
        self.is_running = True
        self._loop_task = asyncio.create_task(self.run_autonomous_loop())
        logger.info("Compliance monitoring loop started (Concurrent Mode).")

    async def stop_monitoring(self):
        """Stop the autonomous monitoring loop."""
        if not self.is_running:
            return
        
        self.is_running = False
        if self._loop_task:
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
        logger.info("Compliance monitoring loop stopped manually.")

    async def batch_process_unprocessed(self, limit: int = 50):
        """Process a batch of unprocessed transactions concurrently via Celery."""
        from backend.tasks import process_transaction_task
        logger.info(f"Triggering distributed batch processing for {limit} transactions...")
        unprocessed = await db.get_unprocessed_transactions(limit=limit)
        
        if not unprocessed:
            logger.info("No unprocessed transactions found.")
            return

        for txn in unprocessed:
            # Sanitize txn for JSON serialization (convert ObjectIDs to strings)
            if "_id" in txn:
                txn["_id"] = str(txn["_id"])
            
            # Dispatch to Celery queue instead of running locally
            process_transaction_task.delay(txn)
            
        logger.info(f"Dispatched {len(unprocessed)} transactions to the Celery queue.")

    async def _process_single_transaction(self, txn: dict):
        """Internal helper to process a single record with the RF ML model and CrewAI."""
        try:
            ts = txn.get('timestamp', 'Unknown')
            logger.info(f"Processing transaction: {txn['transaction_id']}")
            
            # Set transaction context for this task thread/coroutine
            token = txn_context.set(txn['transaction_id'])
            
            # Log Start to DB (Sync for reliability)
            db.insert_agent_activity_sync({
                "agent": "monitoring",
                "event": f"Starting analysis for {txn['transaction_id']}",
                "status": "info",
                "transaction_id": txn['transaction_id']
            })

            # Detection Phase — use full transaction dict to get all RF features
            risk_result = predictor.predict_from_transaction(txn)
            logger.info(f"Phase 1: ML Score = {risk_result.risk_score:.4f} ({risk_result.risk_level})")
            
            db.insert_agent_activity_sync({
                "agent": "violation_detector",
                "event": f"RF Scored: {risk_result.risk_score:.2f} ({risk_result.risk_level})",
                "status": "success" if not risk_result.is_violation else "warn",
                "transaction_id": txn['transaction_id']
            })

            if risk_result.is_violation:
                logger.info(f"Phase 2: High risk detected for {txn['transaction_id']}. Entering RAG + CrewAI workflow...")
                
                # RAG Phase — retrieve relevant policy context (Wrap sync call)
                query = f"Compliance rules for {txn.get('transaction_type') or txn.get('payment_format', 'general transaction')}"
                context = await asyncio.to_thread(retriever.retrieve, query)
                logger.info(f"Phase 3: RAG context retrieved ({len(context)} chunks)")
                
                db.insert_agent_activity_sync({
                    "agent": "policy_rag_agent",
                    "event": f"Retrieved {len(context)} policy context chunks for {txn['transaction_id']}",
                    "status": "info",
                    "transaction_id": txn['transaction_id']
                })

                # Agent Orchestration Phase (Wrap sync call)
                logger.info(f"Phase 4: Starting CrewAI orchestration for {txn['transaction_id']}...")
                crew = self.create_crew(txn, context, risk_result.dict())
                result = await asyncio.to_thread(crew.kickoff)
                explanation = str(result)
                logger.info(f"Phase 5: CrewAI explanation complete for {txn['transaction_id']}.")
            else:
                logger.info(f"Phase 2: Low risk for {txn['transaction_id']}. Skipping RAG + LLM.")
                explanation = "No violation detected by Random Forest model."

            # Reporting Phase — update MongoDB record
            await db.update_transaction_status(
                transaction_id=txn['transaction_id'],
                risk_score=risk_result.risk_score * 100,
                risk_level=risk_result.risk_level,
                violation_flag=risk_result.is_violation
            )
            
            # Log Final Completion (Sync)
            db.insert_agent_activity_sync({
                "agent": "reporting_agent",
                "event": f"Completed analysis for {txn['transaction_id']} -> {risk_result.risk_level}",
                "status": "success",
                "explanation": explanation if risk_result.is_violation else None,
                "transaction_id": txn['transaction_id']
            })
            
            # Reset context after processing
            txn_context.reset(token)
            
            logger.info(f"Completed: {txn['transaction_id']} → {risk_result.risk_level} ({risk_result.risk_score:.4f})")

        except Exception as e:
            logger.error(f"Error processing transaction {txn.get('transaction_id')}: {e}", exc_info=True)
            await db.insert_agent_activity({
                "agent": "monitoring",
                "event": f"Failed to process {txn.get('transaction_id')}: {str(e)[:50]}...",
                "status": "danger"
            })


    async def run_autonomous_loop(self):
        """Main autonomous execution loop with distributed task dispatching."""
        from backend.tasks import process_transaction_task
        while self.is_running:
            logger.info("Autonomous Monitoring Batch Cycle Started...")
            try:
                # Fetch a batch for dispatching
                unprocessed = await db.get_unprocessed_transactions(limit=10)
                
                if not unprocessed:
                    logger.info("No new transactions to process. Sleeping for 20s...")
                    await asyncio.sleep(20)
                    continue

                for txn in unprocessed:
                    # Sanitize
                    if "_id" in txn:
                        txn["_id"] = str(txn["_id"])
                    # Dispatch to Celery queue
                    process_transaction_task.delay(txn)
                    
                logger.info(f"Batch cycle complete: {len(unprocessed)} transactions queued. Sleeping for 30s...")
                await asyncio.sleep(30) # Prevent tight loop flooding the queue

            except Exception as e:
                logger.error(f"Error in autonomous loop: {e}")
                await asyncio.sleep(10)

compliance_crew = ComplianceCrew()
