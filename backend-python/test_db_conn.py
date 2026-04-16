import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def test_mongo():
    uri = os.getenv("MONGO_URI")
    print(f"Connecting to: {uri[:20]}...")
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
    try:
        await client.admin.command('ping')
        print("MongoDB Ping Successful!")
    except Exception as e:
        print(f"MongoDB Ping Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_mongo())
