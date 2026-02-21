
import asyncio, sys, os
sys.path.insert(0, '.')

from backend.agents.crew import compliance_crew
from backend.database import db

async def test():
    try:
        print('Connecting to DB...')
        await db.connect_to_storage()
        
        # Check counts
        total = await db.db.transactions.count_documents({})
        processed = await db.db.transactions.count_documents({'is_processed': True})
        unprocessed_list = await db.get_unprocessed_transactions(limit=5)
        
        print(f'Total: {total}, Processed: {processed}, Unprocessed (sample): {len(unprocessed_list)}')
        
        if not unprocessed_list:
            print('No unprocessed records found.')
            return

        # Try to process one - we will use a timeout to detect hang
        txn = unprocessed_list[0]
        print(f"Attempting to process txn: {txn.get('transaction_id')}...")
        
        import time
        start = time.time()
        
        # Note: _process_single_transaction is async but calls kickoff() which is sync
        await compliance_crew._process_single_transaction(txn)
        
        print(f'Process completed in {time.time() - start:.2f}s')
        
    except Exception as e:
        print(f'ERROR: {e}')
    finally:
        await db.close_storage_connection()

if __name__ == "__main__":
    asyncio.run(test())
