import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check():
    client = AsyncIOMotorClient(os.getenv('MONGO_URI'))
    db = client.get_default_database()
    u = await db['users'].find_one({'email': 'sangeetavarshane@gmail.com'})
    if u:
        print(f"--- DB STATUS: {u.get('email')} ---")
        print(f"Role: {u.get('role')}")
        print(f"Verified: {u.get('isVerified')}")
        print(f"Name: {u.get('name')}")
    else:
        print('User not found in DB.')

if __name__ == '__main__':
    asyncio.run(check())
