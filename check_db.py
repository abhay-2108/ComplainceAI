
import asyncio, sys, os
sys.path.insert(0, '.')
from backend.database import db

async def check():
    await db.connect_to_storage()
    processed = await db.db.transactions.count_documents({'is_processed': True})
    violations = await db.db.violations.count_documents({})
    print(f'Processed: {processed}, Violations: {violations}')
    
    if processed > 0:
        cursor = db.db.transactions.find({'is_processed': True}).sort('timestamp', -1).limit(5)
        async for txn in cursor:
            print(f" - {txn.get('transaction_id')} | Score: {txn.get('risk_score')} | Level: {txn.get('risk_level')}")
    
    await db.close_storage_connection()

if __name__ == "__main__":
    asyncio.run(check())
