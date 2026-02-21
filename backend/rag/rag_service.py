import logging
import httpx
import uuid
import datetime
from backend.rag.pdf_loader import pdf_loader
from backend.rag.embedding_model import embedding_service
from backend.rag.vector_store import vector_store
from backend.rag.retriever import retriever
from backend.config.settings import settings
from backend.database import db

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.loader = pdf_loader
        self.embeddings = embedding_service
        self.store = vector_store
        self.retriever = retriever

    async def ingest_policy(self, file_path: str, filename: str):
        logger.info(f"Starting ingestion for policy: {filename}")
        
        # 1. Extract Text
        text = self.loader.extract_text(file_path)
        if not text:
            logger.error(f"No text extracted from {file_path}")
            return False

        # 2. Chunk Text
        chunks = self.loader.chunk_text(text)
        
        # 3. Generate Embeddings & Store
        embeddings = [self.embeddings.encode(c) for c in chunks]
        metadatas = [{"source": filename, "timestamp": str(datetime.datetime.now())}] * len(chunks)
        ids = [str(uuid.uuid4()) for _ in range(len(chunks))]
        
        self.store.add_documents(chunks, embeddings, metadatas, ids)

        # 4. Save metadata to MongoDB
        await db.db.policies.insert_one({
            "name": filename,
            "upload_date": str(datetime.datetime.now()),
            "status": "Active",
            "chunks_count": len(chunks)
        })
        
        return True

    async def generate_explanation(self, transaction_data: dict, policy_context: list):
        context_text = "\n".join(policy_context)
        prompt = f"""
        You are a Secure AI Compliance Officer.
        Analyze the following transaction data against the provided compliance policy context.
        
        TRANSACTION DATA (Masked):
        {transaction_data}
        
        COMPLIANCE POLICY KEY SECTIONS:
        {context_text}
        
        TASK:
        Generate a clear, audit-ready explanation of why this transaction is flagged as a violation. 
        Cite specific policy points if applicable. Keep it professional and concise.
        """
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.LLM_MODEL_NAME,
                        "prompt": prompt,
                        "stream": False
                    }
                )
                if response.status_code == 200:
                    return response.json().get("response", "Could not generate reasoning.")
                else:
                    logger.error(f"Ollama error: {response.text}")
                    return "Error generating AI explanation."
        except Exception as e:
            logger.error(f"RAG explanation error: {e}")
            return "AI Reasoning Engine currently unavailable."

rag_service = RAGService()
