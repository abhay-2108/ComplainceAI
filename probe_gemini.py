
import os
import google.generativeai as genai

api_key = "AIzaSyBVeXKNa7yHImii_xhomnH0HEP-94PpJFg"
genai.configure(api_key=api_key)

print("--- Listing All Available Models and Methods ---")
try:
    models = genai.list_models()
    for m in models:
        print(f"Name: {m.name}")
        print(f"Methods: {m.supported_generation_methods}")
        print("-" * 20)
except Exception as e:
    print(f"Error listing models: {e}")

# Try the most likely standard pairs
test_pairs = [
    # (LLM, Embeddings)
    ('gemini-1.5-flash', 'models/embedding-001'),
    ('gemini-pro', 'models/embedding-001'),
    ('gemini-2.0-flash', 'models/gemini-embedding-001')
]

for llm_name, emb_name in test_pairs:
    print(f"\n--- Testing Pair: {llm_name} + {emb_name} ---")
    try:
        model = genai.GenerativeModel(llm_name)
        res = model.generate_content("Ping")
        print(f"✅ LLM ({llm_name}) OK: {res.text.strip()}")
    except Exception as e:
        print(f"❌ LLM ({llm_name}) Failed: {e}")
    
    try:
        res = genai.embed_content(model=emb_name, content="test")
        print(f"✅ Embeddings ({emb_name}) OK. Dim: {len(res['embedding'])}")
    except Exception as e:
        print(f"❌ Embeddings ({emb_name}) Failed: {e}")

