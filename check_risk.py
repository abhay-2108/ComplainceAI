import asyncio
from backend.database import db

async def check():
    await db.connect_to_storage()
    low = await db.db.transactions.count_documents({"risk_level": "LOW"})
    medium = await db.db.transactions.count_documents({"risk_level": "MEDIUM"})
    high = await db.db.transactions.count_documents({"risk_level": "HIGH"})
    print(f"Risk Levels - Low: {low}, Medium: {medium}, High: {high}")
    
    # Check if any violation_flag is true
    violations = await db.db.transactions.count_documents({"violation_flag": True})
    print(f"Total Violations (flagged): {violations}")

if __name__ == "__main__":
    asyncio.run(check())
