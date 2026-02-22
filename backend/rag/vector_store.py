import chromadb
from chromadb.config import Settings as ChromaSettings
import logging
from backend.config.settings import settings

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        self.collection = self.client.get_or_create_collection(
            name="compliance_policies_v2"
        )
        logger.info(f"ChromaDB initialized at {settings.CHROMA_DB_PATH}")

    def add_documents(self, documents: list, embeddings: list, metadatas: list, ids: list):
        try:
            self.collection.add(
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"Added {len(documents)} document chunks to vector store.")
        except Exception as e:
            logger.error(f"Error adding documents to ChromaDB: {e}")

    def query(self, query_embeddings: list, n_results: int = 3):
        try:
            results = self.collection.query(
                query_embeddings=[query_embeddings],
                n_results=n_results
            )
            return results
        except Exception as e:
            logger.error(f"Error querying ChromaDB: {e}")
            return None

vector_store = VectorStore()
