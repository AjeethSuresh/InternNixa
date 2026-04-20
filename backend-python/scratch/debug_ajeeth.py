import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def debug_ajeeth():
    client = AsyncIOMotorClient(os.getenv('MONGO_URI'))
    db = client.get_default_database()
    u = await db['users'].find_one({'email': 'ajeethsuresh02@gmail.com'})
    
    print(f"--- DEBUG FOR: {u.get('email')} ---")
    
    # Check enrollments collection
    enrollments = await db['enrollments'].find({'userId': u['_id']}).to_list(length=100)
    print(f"Found {len(enrollments)} enrollment records.")
    
    for en in enrollments:
        print(f"Course: {en.get('courseId')} | Status: {en.get('status')} | isCompleted: {en.get('isCompleted')}")

if __name__ == '__main__':
    asyncio.run(debug_ajeeth())
