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

logger = logging.getLogger(__name__)

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
            verbose=True
        )

    async def start_monitoring(self):
        """Start the autonomous monitoring loop if not already running."""
        if self.is_running:
            return
        
        self.is_running = True
        self._loop_task = asyncio.create_task(self.run_autonomous_loop())
        logger.info("Compliance monitoring loop started manually.")

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
        """Process a batch of unprocessed transactions once."""
        logger.info(f"Triggering batch processing for {limit} transactions...")
        unprocessed = await db.get_unprocessed_transactions(limit=limit)
        
        if not unprocessed:
            logger.info("No unprocessed transactions found.")
            return

        for txn in unprocessed:
            await self._process_single_transaction(txn)
        
        logger.info(f"Batch processing complete for {len(unprocessed)} transactions.")

    async def _process_single_transaction(self, txn: dict):
        """Internal helper to process a single record with the RF ML model and CrewAI."""
        try:
            logger.info(f"Processing transaction: {txn['transaction_id']}")

            # Detection Phase — use full transaction dict to get all RF features
            risk_result = predictor.predict_from_transaction(txn)
            logger.info(f"Phase 1: ML Score = {risk_result.risk_score:.4f} ({risk_result.risk_level})")

            if risk_result.is_violation:
                logger.info("Phase 2: High risk detected. Entering RAG + CrewAI workflow...")
                # RAG Phase — retrieve relevant policy context (Wrap sync call)
                query = f"Compliance rules for {txn.get('transaction_type') or txn.get('payment_format', 'general transaction')}"
                context = await asyncio.to_thread(retriever.retrieve, query)
                logger.info(f"Phase 3: RAG context retrieved ({len(context)} chunks)")

                # Agent Orchestration Phase (Wrap sync call)
                logger.info("Phase 4: Starting CrewAI explanation generation...")
                crew = self.create_crew(txn, context, risk_result.dict())
                result = await asyncio.to_thread(crew.kickoff)
                explanation = str(result)
                logger.info("Phase 5: CrewAI explanation complete.")
            else:
                logger.info("Phase 2: Low risk. Skipping RAG + LLM.")
                explanation = "No violation detected by Random Forest model."

            # Reporting Phase — update MongoDB record
            await db.update_transaction_status(
                transaction_id=txn['transaction_id'],
                risk_score=risk_result.risk_score * 100,
                risk_level=risk_result.risk_level,
                violation_flag=risk_result.is_violation
            )
            logger.info(f"Completed: {txn['transaction_id']} → {risk_result.risk_level} ({risk_result.risk_score:.4f})")

        except Exception as e:
            logger.error(f"Error processing transaction {txn.get('transaction_id')}: {e}", exc_info=True)


    async def run_autonomous_loop(self):
        """Main autonomous execution loop."""
        while self.is_running:
            logger.info("Autonomous Monitoring Cycle Started...")
            try:
                unprocessed = await db.get_unprocessed_transactions(limit=1)
                if not unprocessed:
                    logger.info("No new transactions to process. Sleeping for 30s...")
                    await asyncio.sleep(30)
                    continue

                await self._process_single_transaction(unprocessed[0])

            except Exception as e:
                logger.error(f"Error in autonomous loop: {e}")
                await asyncio.sleep(10)

compliance_crew = ComplianceCrew()
