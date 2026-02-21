import pandas as pd
import asyncio
import os
import uuid
import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from backend.config.settings import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def load_dataset(file_path: str, upscale_to: int = 500000):
    # 1. Connect to MongoDB Atlas
    url = settings.MONGODB_URL
    logger.info(f"Connecting to: {url.split('@')[-1]} (DB: {settings.DATABASE_NAME})")
    
    client = AsyncIOMotorClient(
        url,
        serverSelectionTimeoutMS=5000,
        retryWrites=True
    )
    db = client[settings.DATABASE_NAME]
    
    # 2. Setup Indexes (Strict unique constraint on transaction_id)
    await db.transactions.create_index("transaction_id", unique=True)
    await db.transactions.create_index("is_processed")
    await db.transactions.create_index("timestamp")
    
    logger.info(f"🚀 Adjusting ingestion target: {upscale_to} records...")
    
    # Get current count to avoid over-ingesting
    current_count = await db.transactions.count_documents({})
    if current_count >= upscale_to:
        logger.info(f"Database already has {current_count} records. No further ingestion needed.")
        return

    total_inserted = current_count
    batch_size = 5000 
    
    while total_inserted < upscale_to:
        reader = pd.read_csv(file_path, chunksize=batch_size)
        
        for chunk in reader:
            if total_inserted >= upscale_to:
                break
                
            records = []
            for _, row in chunk.iterrows():
                if total_inserted >= upscale_to:
                    break
                
                # Using a deterministic ID approach based on row hash + loop iteration
                # effectively prevents "duplicate" rows from being inserted twice if the script restarts
                # but for upscaling, we still want unique IDs for the expanded volume.
                # Here we use a salt based on total_inserted to ensure uniqueness during upscale
                unique_seed = f"{row.get('Timestamp')}-{row.get('Account')}-{row.get('Amount Received')}-{total_inserted}"
                
                record = {
                    "transaction_id": f"TXN-{uuid.uuid5(uuid.NAMESPACE_DNS, unique_seed).hex[:12].upper()}",
                    "amount": float(row.get('Amount Received', 0)),
                    "transaction_type": str(row.get('Payment Format', 'UNKNOWN')),
                    "timestamp": str(row.get('Timestamp', datetime.now().strftime("%Y/%m/%d %H:%M"))),
                    "account_id": str(row.get('Account', 'N/A')),
                    "is_processed": False,
                    "risk_score": None,
                    "risk_level": None,
                    "violation_flag": False,
                    "source_file": os.path.basename(file_path)
                }
                records.append(record)
            
            if records:
                try:
                    # Ordered=False allows continuing if some IDs clash
                    await db.transactions.insert_many(records, ordered=False)
                    total_inserted += len(records)
                    if total_inserted % 25000 == 0:
                        logger.info(f"✅ Ingested {total_inserted}/{upscale_to} records...")
                except Exception as e:
                    # Log but keep going
                    logger.warning(f"Batch note (likely duplicate skips): {e}")
                    # If we aren't moving at all, break to avoid infinite loop
                    total_inserted = await db.transactions.count_documents({})
        
        if total_inserted < upscale_to:
            logger.info(f"♻️ Reached end of CSV, continuing upscale to {upscale_to}...")
                
    logger.info(f"🏆 Final cloud database count: {total_inserted} records.")
    client.close()

if __name__ == "__main__":
    import sys
    dataset_path = "backend/datasets/Small_Trans.csv"
    count = 500000
    
    if len(sys.argv) > 1:
        dataset_path = sys.argv[1]
    if len(sys.argv) > 2:
        count = int(sys.argv[2])
    
    if os.path.exists(dataset_path):
        asyncio.run(load_dataset(dataset_path, upscale_to=count))
    else:
        logger.error(f"Dataset file not found: {dataset_path}")
