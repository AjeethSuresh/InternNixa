import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def correct_roles():
    client = AsyncIOMotorClient(os.getenv('MONGO_URI'))
    db = client.get_default_database()
    
    # 1. Restore Ajeeth as a Student
    email_ajeeth = 'ajeethsuresh02@gmail.com'
    await db['users'].update_one(
        {'email': email_ajeeth},
        {'$set': {'role': 'student', 'isVerified': True}}
    )
    print(f"RESTORED: {email_ajeeth} is now a STUDENT.")

    # 2. Set Varshane as a Verified Recruiter
    email_varshane = 'sangeetavarshane@gmail.com'
    # Check if user exists, if not, we can't update, but we'll try to find them
    varshane = await db['users'].find_one({'email': email_varshane})
    
    if varshane:
        await db['users'].update_one(
            {'email': email_varshane},
            {'$set': {'role': 'recruiter', 'isVerified': True}}
        )
        print(f"UPGRADED: {email_varshane} (Varshane HR) is now a VERIFIED RECRUITER.")
    else:
        # If Varshane doesn't exist yet, I'll print a note. 
        # The user should register first, or I can create a dummy password account.
        print(f"NOTE: {email_varshane} not found. Please register this account as a recruiter first!")

if __name__ == '__main__':
    asyncio.run(correct_roles())
