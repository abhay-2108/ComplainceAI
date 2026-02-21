import asyncio
from backend.database import db

async def check():
    await db.connect_to_storage()
    # Find max amount in first 1000
    cursor = db.db.transactions.find().limit(1000)
    amounts = []
    async for doc in cursor:
        amounts.append(doc.get('amount', 0))
    print(f"Max Amount in sample: {max(amounts)}")
    print(f"Mean Amount in sample: {sum(amounts)/len(amounts)}")
    
    # Check types
    types = set()
    cursor = db.db.transactions.find().limit(1000)
    async for doc in cursor:
        types.add(doc.get('transaction_type'))
    print(f"Transaction Types: {types}")

if __name__ == "__main__":
    asyncio.run(check())
