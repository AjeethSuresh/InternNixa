from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List

from config import get_db
from middleware.auth import get_current_user

router = APIRouter()

class EnrollRequest(BaseModel):
    courseId: str

@router.post("/enroll")
async def enroll_user(
    request: EnrollRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    # Check if already enrolled
    existing = await db["enrollments"].find_one({
        "userId": current_user["_id"],
        "courseId": request.courseId
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    enrollment = {
        "userId": current_user["_id"],
        "courseId": request.courseId,
        "completedModules": [],
        "status": "enrolled",
        "enrolledAt": datetime.utcnow()
    }
    
    await db["enrollments"].insert_one(enrollment)
    
    # Return serializable dict
    enrollment["_id"] = str(enrollment["_id"])
    return enrollment

@router.get("/status/{course_id}")
async def get_enrollment_status(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    enrollment = await db["enrollments"].find_one({
        "userId": current_user["_id"],
        "courseId": course_id
    })
    
    if not enrollment:
        return {"enrolled": False}
    
    enrollment["_id"] = str(enrollment["_id"])
    return {"enrolled": True, "enrollment": enrollment}

@router.get("/my-courses")
async def get_my_courses(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    cursor = db["enrollments"].find({"userId": current_user["_id"]})
    enrollments = await cursor.to_list(length=100)
    
    for e in enrollments:
        e["_id"] = str(e["_id"])
        
    return enrollments
