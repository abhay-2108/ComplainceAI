"""
Backfill script: Generates AI explanations for existing violations.
Uses the new google-genai SDK with gemini-2.5-flash.
"""
import os, sys, time
sys.path.insert(0, os.path.dirname(__file__))

from pymongo import MongoClient
from google import genai

MONGO_URL = "mongodb+srv://admin:uno0120@cluster0.tjxahhe.mongodb.net/?appName=Cluster0"
DB_NAME = "compliance_ai"
API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyBVeXKNa7yHImii_xhomnH0HEP-94PpJFg")

client_genai = genai.Client(api_key=API_KEY)
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

violations = list(db.violations.find({}).limit(57))
print(f"Total violations: {len(violations)}")

for i, v in enumerate(violations):
    txn_id = v.get("transaction_id", "UNKNOWN")
    txn = db.transactions.find_one({"transaction_id": txn_id}) or v

    risk_score = txn.get("risk_score", v.get("risk_score", 0))
    amount = txn.get("amount_paid") or txn.get("amount", 0)
    from_bank = txn.get("from_bank", "N/A")
    to_bank = txn.get("to_bank", "N/A")
    pf = txn.get("payment_format") or txn.get("transaction_type", "Wire")
    pc = txn.get("payment_currency", "USD")
    rc = txn.get("receiving_currency", "USD")

    prompt = f"""You are a senior AML compliance officer. Analyze this flagged transaction and provide a concise professional explanation (3-4 sentences).

Transaction ID: {txn_id}
Amount: ${amount:,.2f}
From Bank: {from_bank} → To Bank: {to_bank}
Payment Format: {pf}
Currency: {pc} → {rc}
Risk Score: {risk_score}%

Provide: why this was flagged, specific risk indicators, and recommended action."""

    try:
        r = client_genai.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        explanation = r.text.strip()
        db.violations.update_one({"transaction_id": txn_id}, {"$set": {"explanation": explanation}})
        print(f"  [{i+1}/{len(violations)}] {txn_id} ✓ ({len(explanation)} chars)")
        time.sleep(0.5)  # Rate limit protection
    except Exception as e:
        print(f"  [{i+1}/{len(violations)}] {txn_id} ✗ {e}")
        fallback = f"High-risk transaction flagged by ML model with risk score {risk_score}%. Amount: ${amount:,.2f}. Payment: {pf} ({pc} → {rc}), Bank {from_bank} → Bank {to_bank}. Manual review recommended per AML Policy Section 4.2."
        db.violations.update_one({"transaction_id": txn_id}, {"$set": {"explanation": fallback}})

print("Done!")
client.close()
