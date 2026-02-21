"""
reseed_balanced.py — drops transactions, re-ingests with 60% laundering / 40% normal
Run from project root:
    backend\venv\Scripts\python.exe backend\scripts\reseed_balanced.py
"""
import asyncio, uuid, os, random
import pandas as pd
import numpy as np
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

MONGODB_URL   = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "compliance_db")
CSV_PATH      = os.path.join(os.path.dirname(__file__), "..", "datasets", "Small_Trans.csv")

# ── Target distribution ───────────────────────────────────────────────────────
TOTAL_RECORDS  = 10_000          # total docs to insert
N_LAUNDERING   = int(TOTAL_RECORDS * 0.60)   # 6,000 laundering  (60%)
N_NORMAL       = TOTAL_RECORDS - N_LAUNDERING # 4,000 normal      (40%)
NOISE_FACTOR   = 0.03            # 3% numeric noise when oversampling

def make_txn_id(row: dict, suffix: str = "") -> str:
    token = f"{row['Timestamp']}{row['From Bank']}{row['To Bank']}{row['Amount Paid']}{suffix}"
    return "TXN-" + uuid.uuid5(uuid.NAMESPACE_DNS, token).hex[:12].upper()

def add_noise(value: float) -> float:
    """Add ±NOISE_FACTOR% random noise to a numeric value."""
    return round(value * (1 + random.uniform(-NOISE_FACTOR, NOISE_FACTOR)), 2)

def row_to_doc(row: pd.Series, is_laundering: int, suffix: str = "") -> dict:
    ts_raw = str(row.get("Timestamp", "")).strip()
    try:
        ts = datetime.strptime(ts_raw, "%Y/%m/%d %H:%M")
    except Exception:
        ts = datetime.utcnow()

    amount_paid     = float(row.get("Amount Paid", 0) or 0)
    amount_received = float(row.get("Amount Received", 0) or 0)

    # Apply noise when oversampling laundering rows
    if suffix:
        amount_paid     = add_noise(amount_paid)
        amount_received = add_noise(amount_received)

    return {
        "transaction_id":     make_txn_id(row.to_dict(), suffix),
        "timestamp":          ts.isoformat(),
        # ── RF features ──────────────────────────────────────────────────────
        "amount_paid":        amount_paid,
        "amount_received":    amount_received,
        "from_bank":          float(row.get("From Bank", 0) or 0),
        "to_bank":            float(row.get("To Bank", 0) or 0),
        "payment_currency":   str(row.get("Payment Currency", "US Dollar") or "").strip() or "US Dollar",
        "receiving_currency": str(row.get("Receiving Currency", "US Dollar") or "").strip() or "US Dollar",
        "payment_format":     str(row.get("Payment Format", "Wire") or "").strip() or "Wire",
        # ── Display/legacy ────────────────────────────────────────────────────
        "amount":             amount_paid,
        "transaction_type":   str(row.get("Payment Format", "Wire") or "").strip() or "Wire",
        "account_id":         str(row.get("Account", "")).strip(),
        "is_laundering":      is_laundering,
        "source_file":        "Small_Trans.csv",
        # ── Processing state ──────────────────────────────────────────────────
        "is_processed":       False,
        "risk_score":         None,
        "risk_level":         None,
        "violation_flag":     False,
    }


async def reseed():
    print(f"Connecting to MongoDB…")
    client   = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]
    col      = database["transactions"]

    print(f"Loading CSV: {CSV_PATH}")
    df = pd.read_csv(CSV_PATH)
    df.columns = [c.strip() for c in df.columns]

    laundering_df = df[df["Is Laundering"] == 1].reset_index(drop=True)
    normal_df     = df[df["Is Laundering"] == 0].reset_index(drop=True)

    print(f"Source — Laundering: {len(laundering_df)} | Normal: {len(normal_df)}")
    print(f"Target — Laundering: {N_LAUNDERING} (60%) | Normal: {N_NORMAL} (40%) | Total: {TOTAL_RECORDS}")

    # ── Build laundering docs (oversample with noise) ─────────────────────────
    laundering_docs = []
    rng = np.random.default_rng(42)
    indices = rng.integers(0, len(laundering_df), size=N_LAUNDERING)
    for copy_idx, src_idx in enumerate(indices):
        row = laundering_df.iloc[src_idx]
        doc = row_to_doc(row, is_laundering=1, suffix=str(copy_idx) if copy_idx >= len(laundering_df) else "")
        laundering_docs.append(doc)

    # ── Build normal docs (random undersample, no repetition needed) ──────────
    normal_sample = normal_df.sample(n=N_NORMAL, random_state=42).reset_index(drop=True)
    normal_docs   = [row_to_doc(row, is_laundering=0) for _, row in normal_sample.iterrows()]

    # ── Merge and shuffle ─────────────────────────────────────────────────────
    all_docs = laundering_docs + normal_docs
    random.shuffle(all_docs)

    # ── Drop + re-insert ──────────────────────────────────────────────────────
    print("\nDropping existing transactions collection…")
    await col.drop()

    BATCH = 1000
    for i in range(0, len(all_docs), BATCH):
        await col.insert_many(all_docs[i:i+BATCH])
        print(f"  Inserted {min(i+BATCH, len(all_docs)):,} / {len(all_docs):,}")

    # ── Verify ────────────────────────────────────────────────────────────────
    total      = await col.count_documents({})
    n_launder  = await col.count_documents({"is_laundering": 1})
    n_normal   = await col.count_documents({"is_laundering": 0})
    sample     = await col.find_one({"is_laundering": 1})
    sample.pop("_id", None)

    print(f"\n✅ Done.")
    print(f"   Total:       {total:,}")
    print(f"   Laundering:  {n_launder:,} ({n_launder/total*100:.1f}%)")
    print(f"   Normal:      {n_normal:,}  ({n_normal/total*100:.1f}%)")
    print(f"   Sample keys: {list(sample.keys())}")
    print(f"   Sample amount_paid={sample['amount_paid']}  from_bank={sample['from_bank']}  payment_format={sample['payment_format']}")

    client.close()


if __name__ == "__main__":
    asyncio.run(reseed())
