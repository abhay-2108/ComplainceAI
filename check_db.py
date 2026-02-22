import asyncio
import os
from backend.database import db
from backend.config.settings import settings

async def check():
    await db.connect_to_storage()
    print(f"Connected to {settings.DATABASE_NAME}")
    
    # Check transactions
    total = await db.db.transactions.count_documents({})
    processed = await db.db.transactions.count_documents({"is_processed": True})
    print(f"Transactions - Total: {total}, Processed: {processed}")
    
    # List collections
    collections = await db.db.list_collection_names()
    print(f"Collections: {collections}")
    
    # Check both potential names
    for coll_name in ["agent_activity", "agent_activities"]:
        if coll_name in collections:
            count = await db.db[coll_name].count_documents({})
            print(f"Collection '{coll_name}' count: {count}")
    
    # Check latest records
    logs = await db.db.agent_activity.find().sort("timestamp", -1).limit(5).to_list(5)
    print("\nLatest 5 logs in 'agent_activity':")
    for log in logs:
        print(f"[{log.get('timestamp')}] {log.get('agent')} - {log.get('event')}")
    
    await db.close_storage_connection()

if __name__ == "__main__":
    asyncio.run(check())
