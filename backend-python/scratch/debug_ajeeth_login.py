import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def check_user():
    print(f"Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["internixa"]
    
    email = "ajeethkumar678@gmail.com"
    user = await db["users"].find_one({"email": email})
    
    if not user:
        print(f"USER NOT FOUND: {email}")
        return

    print(f"USER FOUND: {user['name']} ({user['email']})")
    print(f"Role: {user.get('role')}")
    
    password_hash = user.get("password", "")
    print(f"Password Hash in DB: {password_hash[:20]}...")
    
    # Check if it's a valid bcrypt hash
    try:
        is_bcrypt = password_hash.startswith("$2b$") or password_hash.startswith("$2a$")
        print(f"Is valid bcrypt hash format? {is_bcrypt}")
    except:
        print("Could not verify hash format")

    # For debugging: let's try to verify against a common default if one exists, 
    # or just show if it looks like plain text.
    if not password_hash.startswith("$"):
        print("WARNING: Password looks like PLAIN TEXT or non-standard hash.")

if __name__ == "__main__":
    asyncio.run(check_user())
