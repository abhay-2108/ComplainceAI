import logging
import httpx
import uuid
import hashlib
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

    def _content_hash(self, text: str) -> str:
        """SHA-256 hash of the extracted text — unique fingerprint per file content."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    async def _is_already_indexed(self, content_hash: str) -> bool:
        """Check MongoDB policies collection for a matching content hash."""
        existing = await db.db.policies.find_one({"content_hash": content_hash})
        return existing is not None

    async def ingest_policy(self, file_path: str, filename: str) -> dict:
        logger.info(f"Starting ingestion for policy: {filename}")

        # Step 1: Extract text
        text = self.loader.extract_text(file_path)
        if not text:
            logger.error(f"No text extracted from {file_path}")
            return {"success": False, "skipped": False, "reason": "No text extracted"}

        # Step 2: Compute content hash for deduplication
        content_hash = self._content_hash(text)

        # Step 3: Check if this exact content was already indexed
        if await self._is_already_indexed(content_hash):
            logger.info(f"Policy '{filename}' already indexed (hash match). Skipping embedding generation.")
            return {"success": True, "skipped": True}

        # Step 4: Chunk text
        chunks = self.loader.chunk_text(text)

        # Step 5: Generate embeddings & store in ChromaDB
        logger.info(f"Generating {len(chunks)} embeddings for '{filename}'…")
        embeddings = [self.embeddings.encode(c) for c in chunks]
        metadatas = [{"source": filename, "timestamp": str(datetime.datetime.now())}] * len(chunks)
        ids = [str(uuid.uuid4()) for _ in range(len(chunks))]
        self.store.add_documents(chunks, embeddings, metadatas, ids)

        # Step 6: Save metadata + hash to MongoDB
        await db.db.policies.insert_one({
            "name": filename,
            "content_hash": content_hash,
            "upload_date": str(datetime.datetime.now()),
            "status": "Active",
            "chunks_count": len(chunks)
        })

        logger.info(f"Policy '{filename}' successfully indexed with {len(chunks)} chunks.")
        return {"success": True, "skipped": False}

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
