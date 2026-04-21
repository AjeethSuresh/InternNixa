
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_sessions():
    uri = os.environ.get("MONGO_URI", "mongodb+srv://ajeethsuresh02:AjeethSuresh%402002@cluster0.pux9m.mongodb.net/?retryWrites=true&w=majority")
    client = AsyncIOMotorClient(uri)
    db = client["internixa"]
    
    print("\n--- RECENT SESSIONS ---")
    sessions = await db["meeting_sessions"].find().sort("updatedAt", -1).limit(5).to_list(None)
    for s in sessions:
        print(f"MeetingID: {s.get('meetingId')} | User: {s.get('name')} | Status: {s.get('status')} | Updated: {s.get('updatedAt')}")
    
    print("\n--- ALL MEETINGS ---")
    meetings = await db["meetings"].find().sort("createdAt", -1).limit(5).to_list(None)
    for m in meetings:
        print(f"MeetingID: {m.get('meetingId')} | Title: {m.get('title')} | Created: {m.get('createdAt')}")

if __name__ == "__main__":
    asyncio.run(check_sessions())
