import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

async def reset_enrollments():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["internixa"]
    
    result = await db["enrollments"].update_many(
        {},
        {"$set": {"completedModules": [], "status": "enrolled"}}
    )
    
    # Also delete sessions to have a clean slate if needed
    # await db["sessions"].delete_many({})
    
    print(f"Reset {result.modified_count} enrollments successfully!")

if __name__ == "__main__":
    asyncio.run(reset_enrollments())
