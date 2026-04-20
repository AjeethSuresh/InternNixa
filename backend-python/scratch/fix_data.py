import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def fix_data():
    client = AsyncIOMotorClient(os.getenv('MONGO_URI'))
    db = client.get_default_database()
    
    # Fix all enrollments to lowercase 'completed'
    # Use $set as required by MongoDB
    result = await db['enrollments'].update_many(
        {'status': 'COMPLETED'},
        {'$set': {'status': 'completed'}}
    )
    
    print(f"SUCCESS: Normalize {result.modified_count} enrollment records to 'completed'.")

if __name__ == '__main__':
    asyncio.run(fix_data())
