import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

async def cluster_search():
    print(f"Connecting to MongoDB Atlas...")
    client = AsyncIOMotorClient(MONGO_URI)
    
    # Get all database names
    dbs = await client.list_database_names()
    print(f"Found Databases: {dbs}")
    
    target_email = "ajeethkumar678@gmail.com"
    
    for db_name in dbs:
        if db_name in ["admin", "local", "config"]: continue
        
        db = client[db_name]
        colls = await db.list_collection_names()
        
        for coll_name in colls:
            if "users" in coll_name.lower():
                print(f"Searching in {db_name}.{coll_name}...")
                user = await db[coll_name].find_one({"email": target_email})
                if user:
                    print(f"!!! FOUND USER IN {db_name}.{coll_name} !!!")
                    print(f"Name: {user.get('name')}")
                    return

    print(f"User {target_email} not found anywhere in the cluster.")

if __name__ == "__main__":
    asyncio.run(cluster_search())
