import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def verify_ajeeth():
    client = AsyncIOMotorClient(os.getenv('MONGO_URI'))
    db = client.get_default_database()
    email = 'ajeethsuresh02@gmail.com'
    
    # Update both role and verification status
    result = await db['users'].update_one(
        {'email': email},
        {'$set': {
            'isVerified': True, 
            'role': 'recruiter'
        }}
    )
    
    if result.modified_count > 0:
        print(f"SUCCESS: {email} is now a VERIFIED RECRUITER.")
    else:
        print(f"INFO: No changes made (user might already be verified).")

if __name__ == '__main__':
    asyncio.run(verify_ajeeth())
