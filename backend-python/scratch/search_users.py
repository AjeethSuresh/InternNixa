import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

async def search_users():
    print(f"Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["internixa"]
    
    # List all emails to see what we HAVE
    users = await db["users"].find({}, {"email": 1, "name": 1}).to_list(length=100)
    
    print("\n--- Current Users in Database ---")
    for u in users:
        print(f"Name: {u.get('name')} | Email: '{u.get('email')}'")
    print("---------------------------------\n")

if __name__ == "__main__":
    asyncio.run(search_users())
