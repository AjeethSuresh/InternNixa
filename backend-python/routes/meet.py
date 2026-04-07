from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import uuid

from config import get_db
from middleware.auth import get_current_user

router = APIRouter()

class MeetingCreate(BaseModel):
    title: str

class SessionUpdate(BaseModel):
    meetingId: str
    userId: str
    name: str
    email: str
    attentionScore: float
    activeTime: int
    totalTime: int
    status: str  # Active, Distracted, Away

@router.post("/create")
async def create_meeting(meeting: MeetingCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    meeting_id = str(uuid.uuid4())[:8] # Short unique ID
    
    new_meeting = {
        "meetingId": meeting_id,
        "hostId": current_user["_id"],
        "title": meeting.title,
        "createdAt": datetime.utcnow()
    }
    
    await db["meetings"].insert_one(new_meeting)
    return {"meetingId": meeting_id, "title": meeting.title}

@router.get("/{meeting_id}")
async def get_meeting(meeting_id: str):
    db = get_db()
    meeting = await db["meetings"].find_one({"meetingId": meeting_id})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    return {
        "meetingId": meeting["meetingId"],
        "title": meeting["title"],
        "hostId": meeting["hostId"]
    }

@router.post("/session/update")
async def update_session(session_data: SessionUpdate):
    db = get_db()
    
    # Update or insert session data
    query = {
        "meetingId": session_data.meetingId,
        "email": session_data.email
    }
    
    update = {
        "$set": {
            "userId": session_data.userId,
            "name": session_data.name,
            "attentionScore": session_data.attentionScore,
            "activeTime": session_data.activeTime,
            "totalTime": session_data.totalTime,
            "status": session_data.status,
            "updatedAt": datetime.utcnow()
        },
        "$setOnInsert": {
            "joinTime": datetime.utcnow()
        }
    }
    
    await db["meeting_sessions"].update_one(query, update, upsert=True)
    return {"message": "Session updated"}

@router.get("/sessions/{meeting_id}")
async def get_meeting_sessions(meeting_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # Verify host
    meeting = await db["meetings"].find_one({"meetingId": meeting_id})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    if meeting["hostId"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only host can view all sessions")
    
    sessions = await db["meeting_sessions"].find({"meetingId": meeting_id}).to_list(None)
    for s in sessions:
        s["_id"] = str(s["_id"])
    
    return sessions
