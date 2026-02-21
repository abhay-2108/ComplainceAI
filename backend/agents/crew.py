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

    async def run_autonomous_loop(self):
        """
        Main autonomous execution loop.
        1. Fetch unprocessed transactions (Monitoring)
        2. Run ML Prediction (Detection)
        3. Fetch Policy Context (RAG)
        4. Trigger CrewAI for Details
        5. Update MongoDB (Reporting)
        """
        while True:
            logger.info("Autonomous Monitoring Cycle Started...")
            try:
                # 1. Monitoring Phase
                unprocessed = await db.get_unprocessed_transactions(limit=1)
                if not unprocessed:
                    logger.info("No new transactions to process. Sleeping for 30s...")
                    await asyncio.sleep(30)
                    continue

                txn = unprocessed[0]
                logger.info(f"Processing transaction: {txn['transaction_id']}")

                # 2. Detection Phase
                risk_input = RiskInput(
                    amount=txn.get('amount', 0),
                    transaction_type=txn.get('transaction_type', 'UNKNOWN'),
                    account_age=365,
                    frequency=1.0
                )
                risk_result = predictor.predict(risk_input)

                if risk_result.is_violation:
                    # 3. RAG Phase
                    query = f"Compliance rules for {txn.get('transaction_type', 'general transaction')}"
                    context = retriever.retrieve(query)
                    
                    # 4. Agent Orchestration Phase
                    crew = self.create_crew(txn, context, risk_result.dict())
                    result = crew.kickoff()
                    
                    explanation = str(result)
                else:
                    explanation = "No violation detected by ML model."

                # 5. Reporting Phase (Update DB)
                await db.update_transaction_status(
                    transaction_id=txn['transaction_id'],
                    risk_score=risk_result.risk_score * 100,
                    risk_level=risk_result.risk_level,
                    violation_flag=risk_result.is_violation
                )
                
                # If violation, we could also log progress here
                logger.info(f"Completed processing for {txn['transaction_id']}. Result: {risk_result.risk_level}")

            except Exception as e:
                logger.error(f"Error in autonomous loop: {e}")
                await asyncio.sleep(10)

compliance_crew = ComplianceCrew()
