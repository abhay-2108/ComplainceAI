"""
reseed_from_txt.py — parse HI-Small_Patterns.txt and load into MongoDB.

Parses the custom format (BEGIN/END LAUNDERING ATTEMPT markers) and inserts
all real fraud transactions + computes velocity features (Sender/Receiver_Tx_Frequency).
No synthetic data needed — all transactions in the file are labelled is_laundering=1.
Add the Small_Trans.csv normal transactions to balance the dataset.

Run from project root:
    backend\venv\Scripts\python.exe backend\scripts\reseed_from_txt.py
"""

import asyncio, os, uuid, random
import pandas as pd
import numpy as np
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

MONGODB_URL   = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "compliance_db")

TXT_PATH = os.path.join(os.path.dirname(__file__), "..", "datasets", "HI-Small_Patterns.txt")
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "datasets", "Small_Trans.csv")

# Target: 60% fraud, 40% normal
FRAUD_RATIO  = 0.60
TOTAL_TARGET = 10_000   # total docs in DB
BATCH_SIZE   = 1_000


# ── 1. Parse the .txt file ────────────────────────────────────────────────────

def load_txt(filepath: str) -> pd.DataFrame:
    """Parse HI-Small_Patterns.txt — skip BEGIN/END/blank lines, parse CSV rows."""
    rows = []
    cols = ["Timestamp", "From_Bank", "From_Account",
            "To_Bank", "To_Account", "Amount_Received",
            "Receiving_Currency", "Amount_Paid", "Payment_Currency",
            "Payment_Format", "Is_Laundering"]
    with open(filepath, "r") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("BEGIN") or line.startswith("END"):
                continue
            parts = line.split(",")
            if len(parts) == 11:
                rows.append(parts)
    df = pd.DataFrame(rows, columns=cols)
    df["Amount_Paid"]     = pd.to_numeric(df["Amount_Paid"],     errors="coerce").fillna(0)
    df["Amount_Received"] = pd.to_numeric(df["Amount_Received"], errors="coerce").fillna(0)
    df["Is_Laundering"]   = pd.to_numeric(df["Is_Laundering"],   errors="coerce").fillna(1).astype(int)
    return df


def load_csv_normal(filepath: str, n: int) -> pd.DataFrame:
    """Load n normal transactions from Small_Trans.csv."""
    df = pd.read_csv(filepath)
    df.columns = [c.strip() for c in df.columns]
    normal = df[df["Is Laundering"] == 0].sample(n=min(n, len(df[df["Is Laundering"]==0])), random_state=42)
    # Rename to underscore format matching the txt
    return normal.rename(columns={
        "Timestamp":           "Timestamp",
        "From Bank":           "From_Bank",
        "Account":             "From_Account",
        "To Bank":             "To_Bank",
        "Account.1":           "To_Account",
        "Amount Received":     "Amount_Received",
        "Receiving Currency":  "Receiving_Currency",
        "Amount Paid":         "Amount_Paid",
        "Payment Currency":    "Payment_Currency",
        "Payment Format":      "Payment_Format",
        "Is Laundering":       "Is_Laundering",
    })[["Timestamp","From_Bank","From_Account","To_Bank","To_Account",
        "Amount_Received","Receiving_Currency","Amount_Paid","Payment_Currency",
        "Payment_Format","Is_Laundering"]]


# ── 2. Build velocity features ────────────────────────────────────────────────

def add_velocity(df: pd.DataFrame) -> pd.DataFrame:
    sender_freq   = df["From_Account"].value_counts().to_dict()
    receiver_freq = df["To_Account"].value_counts().to_dict()
    df["Sender_Tx_Frequency"]   = df["From_Account"].map(sender_freq).fillna(1).astype(int)
    df["Receiver_Tx_Frequency"] = df["To_Account"].map(receiver_freq).fillna(1).astype(int)
    return df


# ── 3. Build MongoDB document from row ────────────────────────────────────────

def make_txn_id(idx: int, row: pd.Series) -> str:
    # Always include idx to guarantee uniqueness even for identical field values
    token = f"{idx}|{row['Timestamp']}|{row['From_Bank']}|{row['To_Bank']}|{row['Amount_Paid']}"
    return "TXN-" + uuid.uuid5(uuid.NAMESPACE_DNS, token).hex[:12].upper()


def row_to_doc(row: pd.Series, idx: int) -> dict:
    ts_raw = str(row.get("Timestamp", "")).strip()
    try:
        ts = datetime.strptime(ts_raw, "%Y/%m/%d %H:%M")
    except Exception:
        ts = datetime.utcnow()

    amount_paid     = float(row.get("Amount_Paid", 0) or 0)
    amount_received = float(row.get("Amount_Received", 0) or 0)
    from_bank       = str(row.get("From_Bank", "0")).strip()
    to_bank         = str(row.get("To_Bank", "0")).strip()

    return {
        "transaction_id":       make_txn_id(idx, row),
        "timestamp":            ts.isoformat(),
        # ── RF features (match training column names exactly) ─────────────────
        "amount_paid":          amount_paid,
        "amount_received":      amount_received,
        "from_bank":            from_bank,
        "to_bank":              to_bank,
        "payment_currency":     str(row.get("Payment_Currency", "US Dollar") or "").strip() or "US Dollar",
        "receiving_currency":   str(row.get("Receiving_Currency", "US Dollar") or "").strip() or "US Dollar",
        "payment_format":       str(row.get("Payment_Format", "ACH") or "").strip() or "ACH",
        "sender_tx_frequency":  int(row.get("Sender_Tx_Frequency", 1)),
        "receiver_tx_frequency":int(row.get("Receiver_Tx_Frequency", 1)),
        # ── Display / legacy ──────────────────────────────────────────────────
        "amount":               amount_paid,
        "transaction_type":     str(row.get("Payment_Format", "ACH") or "").strip() or "ACH",
        "account_id":           str(row.get("From_Account", "")).strip(),
        "is_laundering":        int(row.get("Is_Laundering", 0)),
        "source_file":          "HI-Small_Patterns.txt" if int(row.get("Is_Laundering",0)) == 1 else "Small_Trans.csv",
        # ── Processing state ──────────────────────────────────────────────────
        "is_processed":         False,
        "risk_score":           None,
        "risk_level":           None,
        "violation_flag":       False,
    }


# ── 4. Main ───────────────────────────────────────────────────────────────────

async def reseed():
    print("Connecting to MongoDB…")
    client   = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]
    col      = database["transactions"]

    # Load fraud transactions from txt
    print(f"Parsing {TXT_PATH}…")
    fraud_df = load_txt(TXT_PATH)
    print(f"  Fraud rows: {len(fraud_df)}")

    # Calculate how many normal rows we need for 60/40 split
    n_fraud  = len(fraud_df)
    n_normal = int(n_fraud * (1 - FRAUD_RATIO) / FRAUD_RATIO)
    print(f"  Target ratio 60/40 → using {n_fraud} fraud + {n_normal} normal rows")

    # Load normal transactions from CSV
    print(f"Loading normal transactions from {CSV_PATH}…")
    normal_df = load_csv_normal(CSV_PATH, n_normal)
    print(f"  Normal rows sampled: {len(normal_df)}")

    # Combine, add velocity, shuffle
    combined_df = pd.concat([fraud_df, normal_df], ignore_index=True)
    combined_df = add_velocity(combined_df)
    combined_df = combined_df.sample(frac=1, random_state=42).reset_index(drop=True)

    total = len(combined_df)
    print(f"\nTotal documents to insert: {total}")
    n_fraud_final  = int((combined_df["Is_Laundering"] == 1).sum())
    n_normal_final = total - n_fraud_final
    print(f"  Fraud:  {n_fraud_final} ({n_fraud_final/total*100:.1f}%)")
    print(f"  Normal: {n_normal_final} ({n_normal_final/total*100:.1f}%)")

    print("\nDropping existing transactions collection…")
    await col.drop()

    docs = [row_to_doc(row, idx) for idx, row in combined_df.iterrows()]
    inserted = 0
    for i in range(0, len(docs), BATCH_SIZE):
        await col.insert_many(docs[i:i+BATCH_SIZE])
        inserted += min(BATCH_SIZE, len(docs) - i)
        print(f"  Inserted {inserted:,} / {total:,}")

    db_total  = await col.count_documents({})
    db_fraud  = await col.count_documents({"is_laundering": 1})
    db_normal = await col.count_documents({"is_laundering": 0})
    sample    = await col.find_one({"is_laundering": 1})
    sample.pop("_id", None)

    print(f"\n✅ Done.")
    print(f"   Total:   {db_total:,}")
    print(f"   Fraud:   {db_fraud:,}  ({db_fraud/db_total*100:.1f}%)")
    print(f"   Normal:  {db_normal:,}  ({db_normal/db_total*100:.1f}%)")
    print(f"   Sample fields: {list(sample.keys())}")
    print(f"   amount_paid={sample['amount_paid']}  from_bank={sample['from_bank']}  payment_format={sample['payment_format']}")

    client.close()


if __name__ == "__main__":
    asyncio.run(reseed())
