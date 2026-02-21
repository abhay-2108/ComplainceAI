import asyncio
from backend.database import db
from backend.config.settings import settings

async def check():
    await db.connect_to_storage()
    tx_count = await db.db.transactions.count_documents({})
    v_count = await db.db.violations.count_documents({})
    print(f"Transactions: {tx_count}")
    print(f"Violations: {v_count}")
    
    if tx_count > 0:
        sample = await db.db.transactions.find_one()
        print(f"Sample Transaction: {sample}")

if __name__ == "__main__":
    asyncio.run(check())
