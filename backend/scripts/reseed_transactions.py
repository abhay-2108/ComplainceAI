"""
reseed_transactions.py  — standalone script, run from project root:
    backend\venv\Scripts\python.exe backend\scripts\reseed_transactions.py
"""
import asyncio
import uuid
import os
import sys
import pandas as pd
from datetime import datetime

# ── Load .env manually ────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL   = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "compliance_db")
CSV_PATH      = os.path.join(os.path.dirname(__file__), "..", "datasets", "Small_Trans.csv")
BATCH_SIZE    = 5000


def build_txn_id(idx: int, row: pd.Series) -> str:
    token = f"{row['Timestamp']}{row['From Bank']}{row['To Bank']}{row['Amount Paid']}"
    return "TXN-" + uuid.uuid5(uuid.NAMESPACE_DNS, token).hex[:12].upper()


async def reseed():
    print(f"Connecting to MongoDB: {MONGODB_URL[:40]}…")
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]
    col = database["transactions"]

    print(f"Loading CSV: {CSV_PATH}")
    df = pd.read_csv(CSV_PATH)
    df.columns = [c.strip() for c in df.columns]
    print(f"Rows: {len(df)} | Columns: {list(df.columns)}")

    print("Dropping existing transactions …")
    await col.drop()

    docs = []
    inserted = 0
    for idx, row in df.iterrows():
        ts_raw = str(row.get("Timestamp", "")).strip()
        try:
            ts = datetime.strptime(ts_raw, "%Y/%m/%d %H:%M")
        except Exception:
            ts = datetime.utcnow()

        doc = {
            "transaction_id":     build_txn_id(idx, row),
            "timestamp":          ts.isoformat(),
            # ── All 20 RF features ──────────────────────────────────────────
            "amount_paid":        float(row.get("Amount Paid", 0) or 0),
            "amount_received":    float(row.get("Amount Received", 0) or 0),
            "from_bank":          float(row.get("From Bank", 0) or 0),
            "to_bank":            float(row.get("To Bank", 0) or 0),
            "payment_currency":   str(row.get("Payment Currency", "US Dollar") or "").strip() or "US Dollar",
            "receiving_currency": str(row.get("Receiving Currency", "US Dollar") or "").strip() or "US Dollar",
            "payment_format":     str(row.get("Payment Format", "Wire") or "").strip() or "Wire",
            # ── Legacy display fields ───────────────────────────────────────
            "amount":             float(row.get("Amount Paid", 0) or 0),
            "transaction_type":   str(row.get("Payment Format", "Wire") or "").strip() or "Wire",
            "account_id":         str(row.get("Account", "")).strip(),
            "is_laundering":      int(row.get("Is Laundering", 0) or 0),
            "source_file":        "Small_Trans.csv",
            # ── Processing state ────────────────────────────────────────────
            "is_processed":       False,
            "risk_score":         None,
            "risk_level":         None,
            "violation_flag":     False,
        }
        docs.append(doc)

        if len(docs) >= BATCH_SIZE:
            await col.insert_many(docs)
            inserted += len(docs)
            print(f"  {inserted:,} rows inserted…")
            docs = []

    if docs:
        await col.insert_many(docs)
        inserted += len(docs)

    total = await col.count_documents({})
    sample = await col.find_one({})
    sample.pop("_id", None)

    print(f"\n✅ Done. {total:,} transactions in MongoDB.")
    print(f"Sample keys: {list(sample.keys())}")
    print(f"Sample amount_paid: {sample.get('amount_paid')}")
    print(f"Sample from_bank:   {sample.get('from_bank')}")
    print(f"Sample payment_fmt: {sample.get('payment_format')}")
    client.close()


if __name__ == "__main__":
    asyncio.run(reseed())
