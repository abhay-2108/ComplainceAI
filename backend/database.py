from motor.motor_asyncio import AsyncIOMotorClient
from backend.config.settings import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

    async def connect_to_storage(self):
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        self.db = self.client[settings.DATABASE_NAME]
        print(f"Connected to MongoDB Atlas: {settings.MONGODB_URL.split('@')[-1]}")

    async def close_storage_connection(self):
        if self.client:
            self.client.close()
            print("MongoDB connection closed.")

    async def create_indexes(self):
        if self.db is not None:
            await self.db.transactions.create_index("transaction_id", unique=True)
            await self.db.transactions.create_index("is_processed")
            await self.db.transactions.create_index("timestamp")
            print("Database indexes created successfully.")

    async def get_unprocessed_transactions(self, limit: int = 10):
        return await self.db.transactions.find({"is_processed": False}).to_list(limit)

    async def update_transaction_status(self, transaction_id: str, risk_score: float, risk_level: str, violation_flag: bool):
        await self.db.transactions.update_one(
            {"transaction_id": transaction_id},
            {
                "$set": {
                    "risk_score": risk_score,
                    "risk_level": risk_level,
                    "violation_flag": violation_flag,
                    "is_processed": True
                }
            }
        )
        if violation_flag:
            txn = await self.db.transactions.find_one({"transaction_id": transaction_id})
            if txn:
                # Avoid duplicates in violations collection
                await self.db.violations.update_one(
                    {"transaction_id": transaction_id},
                    {"$set": txn},
                    upsert=True
                )

    async def get_violations(self, limit: int = 50):
        return await self.db.violations.find().to_list(limit)

    async def get_violation_by_id(self, violation_id: str):
        return await self.db.violations.find_one({"transaction_id": violation_id})

    async def get_all_transactions(self, limit: int = 100):
        return await self.db.transactions.find().to_list(limit)

    async def insert_transaction(self, transaction: dict):
        return await self.db.transactions.insert_one(transaction)

    async def get_metrics(self):
        try:
            total_violations = await self.db.violations.count_documents({})
            critical_risks = await self.db.violations.count_documents({"risk_level": "HIGH"})
            total_records = await self.db.transactions.count_documents({})
            records_scanned = await self.db.transactions.count_documents({"is_processed": True})
            
            # Calculate health score
            health_score = 100
            if records_scanned > 0:
                health_score = max(0, 100 - (total_violations / records_scanned * 100))

            # Real-time Trend Data
            agg_pipeline = [
                {"$group": {
                    "_id": {"$substr": ["$timestamp", 0, 10]}, # Group by YYYY-MM-DD
                    "active": {"$sum": 1},
                    "risk": {"$sum": {"$cond": [{"$eq": ["$violation_flag", True]}, 1, 0]}}
                }},
                {"$sort": {"_id": 1}},
                {"$limit": 14}
            ]
            trend_results = await self.db.transactions.aggregate(agg_pipeline).to_list(14)
            
            trend = []
            for t in trend_results:
                trend.append({
                    "name": t["_id"],
                    "active": t["active"],
                    "risk": t["risk"]
                })
                
            if not trend:
                trend = [{"name": "No Data", "active": 0, "risk": 0}]

            return {
                "total_violations": total_violations,
                "critical_risks": critical_risks,
                "health_score": f"{int(health_score)}%",
                "total_records": str(total_records),
                "records_scanned": str(records_scanned),
                "trend": trend
            }
        except Exception as e:
            print(f"Error in get_metrics: {e}")
            return {
                "total_violations": 0,
                "critical_risks": 0,
                "health_score": "100%",
                "total_records": "0",
                "records_scanned": "0",
                "trend": [{"name": "Error", "active": 0, "risk": 0}]
            }

db = Database()
