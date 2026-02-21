import logging
from backend.rag.vector_store import vector_store
from backend.rag.embedding_model import embedding_service

logger = logging.getLogger(__name__)

class Retriever:
    def __init__(self):
        self.store = vector_store
        self.embeddings = embedding_service

    def retrieve(self, query: str, top_k: int = 3):
        logger.info(f"Retrieving context for query: {query}")
        query_vector = self.embeddings.encode(query)
        results = self.store.query(query_vector, n_results=top_k)
        
        if results and results['documents']:
            return results['documents'][0]
        return []

retriever = Retriever()
