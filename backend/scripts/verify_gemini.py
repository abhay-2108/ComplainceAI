import os
import sys
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

# Ensure the project root is in the path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.config.settings import settings

def test_gemini_llm():
    print("Testing Gemini LLM...")
    if not settings.GOOGLE_API_KEY:
        print("Error: GOOGLE_API_KEY not found in settings.")
        return False
    
    try:
        llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL_NAME,
            google_api_key=settings.GOOGLE_API_KEY
        )
        response = llm.invoke("Hello, are you operational?")
        print(f"Response: {response.content}")
        return True
    except Exception as e:
        print(f"Error testing Gemini LLM: {e}")
        return False

def test_gemini_embeddings():
    print("\nTesting Gemini Embeddings...")
    if not settings.GOOGLE_API_KEY:
        print("Error: GOOGLE_API_KEY not found in settings.")
        return False
    
    try:
        embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.GEMINI_EMBEDDING_MODEL,
            google_api_key=settings.GOOGLE_API_KEY
        )
        vector = embeddings.embed_query("Compliance testing")
        print(f"Embedding successful. Vector length: {len(vector)}")
        return True
    except Exception as e:
        print(f"Error testing Gemini Embeddings: {e}")
        return False

if __name__ == "__main__":
    llm_ok = test_gemini_llm()
    emb_ok = test_gemini_embeddings()
    
    if llm_ok and emb_ok:
        print("\nGemini Migration Verified Successfully!")
    else:
        print("\nGemini Migration Verification Failed. Check your GOOGLE_API_KEY.")
