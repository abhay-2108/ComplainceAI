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

    def insert_agent_activity_sync(self, activity: dict):
        """Synchronous version for Celery workers or threads."""
        try:
            from pymongo import MongoClient
            if "timestamp" not in activity:
                import datetime
                activity["timestamp"] = datetime.datetime.utcnow().isoformat()
            
            client = MongoClient(settings.MONGODB_URL)
            db = client[settings.DATABASE_NAME]
            db.agent_activity.insert_one(activity)
            client.close()
            return True
        except Exception as e:
            print(f"Sync log failed: {e}")
            return False

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

    async def insert_agent_activity(self, activity: dict):
        """Log a specific step or action taken by an agent."""
        if "timestamp" not in activity:
            import datetime
            activity["timestamp"] = datetime.datetime.utcnow().isoformat()
        return await self.db.agent_activity.insert_one(activity)

    async def get_agent_activities(self, agent_id: str = None, transaction_id: str = None, limit: int = 50):
        """Fetch logs for a specific agent, transaction, or all agents."""
        query = {}
        if agent_id: query["agent"] = agent_id
        if transaction_id: query["transaction_id"] = transaction_id
        return await self.db.agent_activity.find(query).sort("timestamp", -1).to_list(limit)

    async def get_violation_explanation(self, transaction_id: str):
        """Fetch the final AI explanation for a specific violation."""
        res = await self.db.violations.find_one({"transaction_id": transaction_id}, {"explanation": 1, "_id": 0})
        return res.get("explanation") if res else None

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

            # AML Specific: Total Volume and Laundering Volume
            vol_pipeline = [
                {"$group": {
                    "_id": None,
                    "total_volume": {"$sum": "$amount"},
                    "laundering_volume": {"$sum": {"$cond": [{"$eq": ["$violation_flag", True]}, "$amount", 0]}}
                }}
            ]
            vol_results = await self.db.transactions.aggregate(vol_pipeline).to_list(1)
            total_volume = 0
            laundering_volume = 0
            if vol_results:
                total_volume = vol_results[0].get("total_volume", 0)
                laundering_volume = vol_results[0].get("laundering_volume", 0)

            # Payment Format Distribution
            format_pipeline = [
                {"$group": {
                    "_id": "$transaction_type",
                    "value": {"$sum": 1}
                }},
                {"$project": {"name": "$_id", "value": 1, "_id": 0}},
                {"$sort": {"value": -1}},
                {"$limit": 5}
            ]
            format_distribution = await self.db.transactions.aggregate(format_pipeline).to_list(5)

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
                "total_volume": f"${total_volume/1e9:.2f}B" if total_volume > 1e9 else f"${total_volume/1e6:.1f}M",
                "laundering_volume": f"${laundering_volume/1e6:.1f}M",
                "trend": trend,
                "format_distribution": format_distribution
            }
        except Exception as e:
            print(f"Error in get_metrics: {e}")
            return {
                "total_violations": 0,
                "critical_risks": 0,
                "health_score": "100%",
                "total_records": "0",
                "records_scanned": "0",
                "total_volume": "$0",
                "laundering_volume": "$0",
                "trend": [{"name": "Error", "active": 0, "risk": 0}],
                "format_distribution": []
            }

    async def get_reports_data(self):
        """Aggregate data for the Reports page."""
        try:
            # Risk distribution by type
            risk_dist = await self.db.violations.aggregate([
                {"$group": {"_id": "$transaction_type", "value": {"$sum": 1}}},
                {"$project": {"name": "$_id", "value": 1, "_id": 0}},
                {"$sort": {"value": -1}}, {"$limit": 6}
            ]).to_list(6)

            # Daily trend (last 14 days)
            daily_trend = await self.db.violations.aggregate([
                {"$group": {
                    "_id": {"$substr": ["$timestamp", 0, 10]},
                    "violations": {"$sum": 1},
                    "total_amount": {"$sum": "$amount"}
                }},
                {"$sort": {"_id": 1}}, {"$limit": 14},
                {"$project": {"date": "$_id", "violations": 1, "total_amount": 1, "_id": 0}}
            ]).to_list(14)

            # Risk level breakdown
            risk_levels = await self.db.violations.aggregate([
                {"$group": {"_id": "$risk_level", "count": {"$sum": 1}}},
                {"$project": {"level": "$_id", "count": 1, "_id": 0}}
            ]).to_list(10)

            # Top accounts by violations
            top_accounts = await self.db.violations.aggregate([
                {"$group": {"_id": "$account_id", "violations": {"$sum": 1}, "total_amount": {"$sum": "$amount"}}},
                {"$sort": {"violations": -1}}, {"$limit": 5},
                {"$project": {"account": "$_id", "violations": 1, "total_amount": 1, "_id": 0}}
            ]).to_list(5)

            # Recent AI Narratives (Final Agent Responses)
            recent_narratives = await self.db.agent_activity.find(
                {"agent": "reporting_agent", "explanation": {"$ne": None}},
                {"transaction_id": 1, "explanation": 1, "timestamp": 1, "_id": 0}
            ).sort("timestamp", -1).limit(6).to_list(6)

            # Global Metrics
            total_scanned = await self.db.transactions.count_documents({"is_processed": True})
            avg_risk = 0
            if total_scanned > 0:
                risk_agg = await self.db.transactions.aggregate([
                    {"$match": {"is_processed": True, "risk_score": {"$ne": None}}},
                    {"$group": {"_id": None, "avg": {"$avg": "$risk_score"}}}
                ]).to_list(1)
                if risk_agg:
                    avg_risk = risk_agg[0]["avg"]

            return {
                "risk_distribution": risk_dist,
                "daily_trend": daily_trend,
                "risk_levels": risk_levels,
                "top_accounts": top_accounts,
                "recent_narratives": recent_narratives,
                "stats": {
                    "avg_risk_score": round(avg_risk, 1),
                    "pipeline_coverage": f"{min(100, (total_scanned / 1000) * 100):.1f}%" if total_scanned < 1000 else "100%",
                    "total_scanned": total_scanned
                }
            }
        except Exception as e:
            print(f"Error in get_reports_data: {e}")
            return {"risk_distribution": [], "daily_trend": [], "risk_levels": [], "top_accounts": []}

    async def get_audit_logs(self, limit: int = 100):
        """Return processed transactions as audit log entries."""
        try:
            docs = await self.db.transactions.find(
                {"is_processed": True},
                {"transaction_id": 1, "timestamp": 1, "risk_level": 1, "risk_score": 1,
                 "violation_flag": 1, "transaction_type": 1, "amount": 1, "account_id": 1}
            ).sort("timestamp", -1).to_list(limit)
            return docs
        except Exception as e:
            print(f"Error in get_audit_logs: {e}")
            return []

    async def get_predictions_analytics(self):
        """Aggregate model performance data from processed transactions."""
        try:
            total = await self.db.transactions.count_documents({"is_processed": True})
            flagged = await self.db.transactions.count_documents({"violation_flag": True})
            not_flagged = total - flagged

            # Score distribution buckets
            score_pipeline = [
                {"$match": {"is_processed": True, "risk_score": {"$ne": None}}},
                {"$bucket": {
                    "groupBy": "$risk_score",
                    "boundaries": [0, 20, 40, 60, 80, 100],
                    "default": "Other",
                    "output": {"count": {"$sum": 1}}
                }}
            ]
            score_buckets = await self.db.transactions.aggregate(score_pipeline).to_list(6)

            # Risk level distribution
            risk_dist = await self.db.transactions.aggregate([
                {"$match": {"is_processed": True}},
                {"$group": {"_id": "$risk_level", "value": {"$sum": 1}}},
                {"$project": {"name": "$_id", "value": 1, "_id": 0}}
            ]).to_list(5)

            # Average risk score per transaction type
            feature_importance = await self.db.transactions.aggregate([
                {"$match": {"is_processed": True, "risk_score": {"$ne": None}}},
                {"$group": {"_id": "$transaction_type", "avg_score": {"$avg": "$risk_score"}, "count": {"$sum": 1}}},
                {"$sort": {"avg_score": -1}}, {"$limit": 8},
                {"$project": {"feature": "$_id", "importance": "$avg_score", "count": 1, "_id": 0}}
            ]).to_list(8)

            return {
                "total_processed": total,
                "flagged": flagged,
                "clean": not_flagged,
                "score_distribution": [
                    {"range": f"{b.get('_id', 0)}-{b.get('_id', 0)+20}", "count": b["count"]}
                    for b in score_buckets if isinstance(b.get("_id"), (int, float))
                ],
                "risk_distribution": risk_dist,
                "feature_importance": feature_importance
            }
        except Exception as e:
            print(f"Error in get_predictions_analytics: {e}")
            return {"total_processed": 0, "flagged": 0, "clean": 0, "score_distribution": [], "risk_distribution": [], "feature_importance": []}

db = Database()
