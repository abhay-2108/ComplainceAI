import asyncio
from backend.database import db

async def reset():
    await db.connect_to_storage()
    # Reset first 500 records to unprocessed so agents pick them up with new logic
    result = await db.db.transactions.update_many(
        {"is_processed": True},
        {"$set": {"is_processed": False, "risk_level": None, "violation_flag": False}}
    )
    print(f"Reset {result.modified_count} records to unprocessed state.")
    
    # Also clear violations collection to start fresh demo
    await db.db.violations.delete_many({})
    print("Cleared violations collection for fresh analysis.")

if __name__ == "__main__":
    asyncio.run(reset())
