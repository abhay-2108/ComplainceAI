import asyncio
import json
from backend.database import db
from backend.config.settings import settings

async def check():
    await db.connect_to_storage()
    metrics = await db.get_metrics()
    print("Full Metrics JSON:")
    print(json.dumps(metrics, indent=2))
    
    # Check is_processed distribution
    processed_count = await db.db.transactions.count_documents({"is_processed": True})
    unprocessed_count = await db.db.transactions.count_documents({"is_processed": False})
    print(f"Processed: {processed_count}")
    print(f"Unprocessed: {unprocessed_count}")
    
    # Check timestamp format
    sample = await db.db.transactions.find_one()
    if sample:
        print(f"Timestamp Sample: '{sample.get('timestamp')}'")

if __name__ == "__main__":
    asyncio.run(check())
